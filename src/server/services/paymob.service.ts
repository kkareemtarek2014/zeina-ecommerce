import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { isFeatureEnabled } from '@/config/features.config';
import { SITE } from '@/config/site.config';
import {
  paymobIntentionInputSchema,
  type PaymentStatusDTO,
  type PaymobIntentionResult,
} from '@/shared/contracts/payment.contract';
import { getCloudflareEnv, getRequestDb } from '@/server/db/request';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as ordersRepo from '@/server/repositories/orders.repo';
import * as paymentsRepo from '@/server/repositories/payments.repo';
import {
  recordOrderStatusChange,
} from '@/server/services/order-timeline.service';
import { createNotification } from '@/server/services/notifications.service';
import { tryAutoCreateShipment } from '@/server/services/bosta.service';
import { fetchWithRetry } from '@/server/lib/retry';
import * as webhookEventsRepo from '@/server/repositories/webhook-events.repo';

const PAYMOB_BASE = 'https://accept.paymob.com';

type PaymobSecrets = {
  secretKey: string;
  publicKey: string;
  hmacSecret: string;
  cardIntegrationId: number;
  walletIntegrationId: number;
  mock: boolean;
};

function readPaymobSecrets(env: CloudflareEnv): PaymobSecrets | null {
  const secretKey = env.PAYMOB_SECRET_KEY?.trim();
  if (!secretKey) return null;

  const mock = secretKey === 'mock';
  if (mock) {
    return {
      secretKey: 'mock',
      publicKey: env.PAYMOB_PUBLIC_KEY?.trim() || 'pk_test_mock',
      hmacSecret: env.PAYMOB_HMAC_SECRET?.trim() || 'mock_hmac',
      cardIntegrationId: Number(env.PAYMOB_INTEGRATION_ID_CARD ?? '1000'),
      walletIntegrationId: Number(env.PAYMOB_INTEGRATION_ID_WALLET ?? '1001'),
      mock: true,
    };
  }

  const publicKey = env.PAYMOB_PUBLIC_KEY?.trim();
  const hmacSecret = env.PAYMOB_HMAC_SECRET?.trim();
  const cardId = Number(env.PAYMOB_INTEGRATION_ID_CARD);
  const walletId = Number(env.PAYMOB_INTEGRATION_ID_WALLET);
  if (!publicKey || !hmacSecret || !Number.isFinite(cardId) || !Number.isFinite(walletId)) {
    return null;
  }
  return {
    secretKey,
    publicKey,
    hmacSecret,
    cardIntegrationId: cardId,
    walletIntegrationId: walletId,
    mock: false,
  };
}

/** P15 health — never exposes secret values. */
export function readPaymobSecretsPublic(
  env: CloudflareEnv,
): { mock: boolean } | null {
  const secrets = readPaymobSecrets(env);
  if (!secrets) return null;
  return { mock: secrets.mock };
}

export function isOnlinePaymentsAvailable(env: CloudflareEnv): boolean {
  return isFeatureEnabled('online_payments') && readPaymobSecrets(env) != null;
}

export async function getOnlinePaymentsAvailability(): Promise<boolean> {
  const env = await getCloudflareEnv();
  return isOnlinePaymentsAvailable(env);
}

function egpToPiasters(egp: number): number {
  return Math.round(egp) * 100;
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? 'Customer';
  const last = parts.slice(1).join(' ') || first;
  return { first, last };
}

function buildCheckoutUrl(publicKey: string, clientSecret: string): string {
  const url = new URL(`${PAYMOB_BASE}/unifiedcheckout/`);
  url.searchParams.set('publicKey', publicKey);
  url.searchParams.set('clientSecret', clientSecret);
  return url.toString();
}

function orderEmail(orderId: string): string {
  try {
    const host = new URL(SITE.url).hostname;
    return `order+${orderId.toLowerCase()}@${host}`;
  } catch {
    return `order+${orderId.toLowerCase()}@sqoosh.local`;
  }
}

function stringifyField(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value == null) return '';
  return String(value);
}

/** HMAC-SHA512 over Paymob's documented transaction field order. */
export function verifyPaymobTransactionHmac(
  obj: Record<string, unknown>,
  receivedHmac: string,
  hmacSecret: string,
): boolean {
  if (!receivedHmac || !hmacSecret) return false;

  const order = (obj.order as Record<string, unknown> | undefined) ?? {};
  const source =
    (obj.source_data as Record<string, unknown> | undefined) ?? {};

  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    order.id,
    obj.owner,
    obj.pending,
    source.pan,
    source.sub_type,
    source.type,
    obj.success,
  ].map(stringifyField);

  const concat = fields.join('');
  const computed = createHmac('sha512', hmacSecret)
    .update(concat)
    .digest('hex');

  try {
    const a = Buffer.from(computed, 'utf8');
    const b = Buffer.from(receivedHmac, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function createLiveIntention(
  secrets: PaymobSecrets,
  input: {
    amountPiasters: number;
    orderId: string;
    method: 'card' | 'wallet';
    fullName: string;
    phone: string;
    items: Array<{ name: string; amount: number; quantity: number }>;
    notificationUrl: string;
    redirectionUrl: string;
  },
): Promise<{ intentionId: string; clientSecret: string; raw: Record<string, unknown> }> {
  const { first, last } = splitName(input.fullName);
  const integrationId =
    input.method === 'wallet'
      ? secrets.walletIntegrationId
      : secrets.cardIntegrationId;

  const body = {
    amount: input.amountPiasters,
    currency: 'EGP',
    payment_methods: [integrationId],
    items: input.items,
    billing_data: {
      first_name: first,
      last_name: last,
      email: orderEmail(input.orderId),
      phone_number: input.phone.startsWith('+') ? input.phone : `+2${input.phone}`,
      apartment: 'NA',
      floor: 'NA',
      street: 'NA',
      building: 'NA',
      shipping_method: 'NA',
      postal_code: 'NA',
      city: 'NA',
      country: 'EG',
      state: 'NA',
    },
    customer: {
      first_name: first,
      last_name: last,
      email: orderEmail(input.orderId),
    },
    extras: { merchant_order_id: input.orderId },
    special_reference: input.orderId,
    notification_url: input.notificationUrl,
    redirection_url: input.redirectionUrl,
  };

  const res = await fetchWithRetry(
    `${PAYMOB_BASE}/v1/intention/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${secrets.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    { label: 'paymob-intention' },
  );

  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const detail =
      typeof raw.detail === 'string'
        ? raw.detail
        : typeof raw.message === 'string'
          ? raw.message
          : `Paymob intention failed (${res.status})`;
    throw new ValidationError(detail);
  }

  const clientSecret =
    typeof raw.client_secret === 'string' ? raw.client_secret : '';
  const intentionId =
    typeof raw.id === 'string' || typeof raw.id === 'number'
      ? String(raw.id)
      : '';
  if (!clientSecret || !intentionId) {
    throw new ValidationError('Paymob intention response missing client_secret');
  }

  return { intentionId, clientSecret, raw };
}

export async function createPaymobIntention(
  raw: unknown,
): Promise<PaymobIntentionResult> {
  const parsed = paymobIntentionInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const env = await getCloudflareEnv();
  if (!isFeatureEnabled('online_payments')) {
    throw new ValidationError('Online payments are not enabled');
  }
  const secrets = readPaymobSecrets(env);
  if (!secrets) {
    throw new ValidationError('Paymob is not configured');
  }

  const db = await getRequestDb();
  const found = await ordersRepo.findOrderById(db, parsed.data.orderId);
  if (!found) throw new NotFoundError('Order not found');

  const { order, items } = found;
  if (order.paymentMethod !== 'card' && order.paymentMethod !== 'wallet') {
    throw new ValidationError('Order is not an online payment order');
  }
  if (order.status === 'cancelled') {
    throw new ConflictError('Order was cancelled');
  }
  if (order.paymentStatus === 'paid') {
    throw new ConflictError('Order is already paid');
  }

  const existingPending = await paymentsRepo.findPendingPaymentForOrder(
    db,
    order.id,
  );
  if (existingPending?.clientSecret && existingPending.paymobIntentionId) {
    const baseUrl = SITE.url.replace(/\/$/, '');
    return {
      orderId: order.id,
      paymentId: existingPending.id,
      clientSecret: existingPending.clientSecret,
      publicKey: secrets.publicKey,
      checkoutUrl: secrets.mock
        ? `${baseUrl}/order/${encodeURIComponent(order.id)}`
        : buildCheckoutUrl(secrets.publicKey, existingPending.clientSecret),
    };
  }

  const amountPiasters = egpToPiasters(order.total);
  const baseUrl = SITE.url.replace(/\/$/, '');
  const notificationUrl = `${baseUrl}/api/webhooks/paymob`;
  const redirectionUrl = `${baseUrl}/order/${encodeURIComponent(order.id)}`;

  let intentionId: string;
  let clientSecret: string;
  let providerRaw: Record<string, unknown>;

  if (secrets.mock) {
    intentionId = `mock_int_${order.id}`;
    clientSecret = `mock_cs_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    providerRaw = { mock: true, intentionId, clientSecret };
  } else {
    const created = await createLiveIntention(secrets, {
      amountPiasters,
      orderId: order.id,
      method: order.paymentMethod,
      fullName: order.fullName,
      phone: order.phone,
      items: items.map((i) => ({
        name: i.name.slice(0, 100),
        amount: egpToPiasters(i.unitPrice),
        quantity: i.quantity,
      })),
      notificationUrl,
      redirectionUrl,
    });
    intentionId = created.intentionId;
    clientSecret = created.clientSecret;
    providerRaw = created.raw;
  }

  const now = new Date();
  const paymentId = `pay_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  await paymentsRepo.insertPayment(db, {
    id: paymentId,
    orderId: order.id,
    provider: 'paymob',
    method: order.paymentMethod,
    amount: order.total,
    currency: 'EGP',
    paymobIntentionId: intentionId,
    paymobTransactionId: null,
    clientSecret,
    status: 'pending',
    raw: providerRaw,
    createdAt: now,
    updatedAt: now,
  });

  if (order.paymentStatus === 'failed') {
    await ordersRepo.updateOrderPayment(db, order.id, {
      paymentStatus: 'pending',
    });
  }

  const checkoutUrl = secrets.mock
    ? `${baseUrl}/order/${encodeURIComponent(order.id)}`
    : buildCheckoutUrl(secrets.publicKey, clientSecret);

  return {
    orderId: order.id,
    paymentId,
    clientSecret,
    publicKey: secrets.publicKey,
    checkoutUrl,
  };
}

export async function getPaymentStatusForOrder(
  orderId: string,
): Promise<PaymentStatusDTO> {
  const db = await getRequestDb();
  const found = await ordersRepo.findOrderById(db, orderId);
  if (!found) throw new NotFoundError('Order not found');

  const payment = await paymentsRepo.findLatestPaymentForOrder(db, orderId);
  return {
    orderId: found.order.id,
    paymentMethod: found.order.paymentMethod,
    paymentStatus: found.order.paymentStatus,
    status: found.order.status,
    amount: found.order.total,
    providerStatus: payment?.status ?? null,
  };
}

type WebhookBody = {
  type?: string;
  obj?: Record<string, unknown>;
};

export async function handlePaymobWebhook(
  request: Request,
): Promise<{ ok: true; alreadyProcessed?: boolean }> {
  const env = await getCloudflareEnv();
  const secrets = readPaymobSecrets(env);
  if (!secrets) {
    throw new ForbiddenError('Paymob is not configured');
  }

  const url = new URL(request.url);
  const hmacFromQuery = url.searchParams.get('hmac') ?? '';

  let body: WebhookBody;
  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    throw new ValidationError('Invalid webhook body');
  }

  const obj = body.obj;
  if (!obj || typeof obj !== 'object') {
    throw new ValidationError('Missing transaction object');
  }

  const hmac =
    hmacFromQuery ||
    (typeof (body as { hmac?: string }).hmac === 'string'
      ? (body as { hmac: string }).hmac
      : '');

  const valid = verifyPaymobTransactionHmac(
    obj,
    hmac,
    secrets.hmacSecret,
  );
  // Mock: accept hmac === 'mock' or when secret is mock and success boolean present
  const mockOk =
    secrets.mock &&
    (hmac === 'mock' || hmac === secrets.hmacSecret || !hmac);
  if (!valid && !mockOk) {
    throw new ForbiddenError('Invalid Paymob HMAC');
  }

  const transactionId = stringifyField(obj.id);
  if (!transactionId) throw new ValidationError('Missing transaction id');

  const db = await getRequestDb();

  const success =
    obj.success === true ||
    obj.success === 'true' ||
    stringifyField(obj.success) === 'true';
  const pending =
    obj.pending === true ||
    obj.pending === 'true' ||
    stringifyField(obj.pending) === 'true';

  const outcome: 'pending' | 'success' | 'failed' = pending
    ? 'pending'
    : success
      ? 'success'
      : 'failed';
  const eventKey = `txn:${transactionId}:${outcome}`;

  const claimed = await webhookEventsRepo.tryClaimWebhookEvent(db, {
    provider: 'paymob',
    eventId: eventKey,
  });
  if (!claimed) {
    return { ok: true, alreadyProcessed: true };
  }

  const existingTxn = await paymentsRepo.findPaymentByTransactionId(
    db,
    transactionId,
  );
  // Terminal success/failed already applied for this txn → skip (pending may have set the id).
  if (
    existingTxn &&
    (existingTxn.status === 'paid' ||
      existingTxn.status === 'failed' ||
      existingTxn.status === 'refunded') &&
    outcome !== 'pending'
  ) {
    return { ok: true, alreadyProcessed: true };
  }
  if (existingTxn && outcome === 'pending' && existingTxn.status !== 'pending') {
    return { ok: true, alreadyProcessed: true };
  }

  const orderObj = (obj.order as Record<string, unknown> | undefined) ?? {};
  const extras = (obj.payment_key_claims as Record<string, unknown> | undefined)
    ?.extra as Record<string, unknown> | undefined;

  let orderId =
    stringifyField(obj.merchant_order_id) ||
    stringifyField(orderObj.merchant_order_id) ||
    stringifyField(extras?.merchant_order_id) ||
    stringifyField(obj.special_reference);

  const intentionHint =
    stringifyField(obj.intention_order_id) ||
    stringifyField(obj.intention_id);

  let payment =
    existingTxn ??
    (intentionHint
      ? await paymentsRepo.findPaymentByIntentionId(db, intentionHint)
      : null) ??
    null;

  if (!payment && orderId) {
    payment = await paymentsRepo.findLatestPaymentForOrder(db, orderId);
  }

  if (!payment) {
    // Fall back: order.id on Paymob order object may be our special_reference
    const candidate = stringifyField(orderObj.id);
    if (candidate) {
      const byOrder = await ordersRepo.findOrderById(db, candidate);
      if (byOrder) {
        orderId = byOrder.order.id;
        payment = await paymentsRepo.findLatestPaymentForOrder(db, orderId);
      }
    }
  }

  if (!payment) {
    throw new NotFoundError('Payment not found for webhook');
  }

  orderId = payment.orderId;
  const found = await ordersRepo.findOrderById(db, orderId);
  if (!found) throw new NotFoundError('Order not found');

  if (pending) {
    await paymentsRepo.updatePayment(db, payment.id, {
      paymobTransactionId: transactionId,
      raw: obj,
      updatedAt: new Date(),
    });
    return { ok: true };
  }

  const now = new Date();
  if (success) {
    await paymentsRepo.updatePayment(db, payment.id, {
      paymobTransactionId: transactionId,
      status: 'paid',
      raw: obj,
      updatedAt: now,
    });

    const prevStatus = found.order.status;
    await ordersRepo.updateOrderPayment(db, orderId, {
      paymentStatus: 'paid',
      status: prevStatus === 'placed' ? 'confirmed' : prevStatus,
    });

    if (prevStatus === 'placed') {
      await recordOrderStatusChange(db, {
        orderId,
        fromStatus: 'placed',
        toStatus: 'confirmed',
        actor: 'paymob',
        note: `Paymob payment success · txn ${transactionId}`,
      });
    }

    await createNotification(db, {
      type: 'new_order',
      title: 'Payment received',
      body: `${orderId} paid via Paymob`,
      entity: 'order',
      entityId: orderId,
      dedupe: true,
    }).catch(() => undefined);

    await tryAutoCreateShipment(orderId);

    return { ok: true };
  }

  await paymentsRepo.updatePayment(db, payment.id, {
    paymobTransactionId: transactionId,
    status: 'failed',
    raw: obj,
    updatedAt: now,
  });
  await ordersRepo.updateOrderPayment(db, orderId, {
    paymentStatus: 'failed',
  });
  await createNotification(db, {
    type: 'payment_failed',
    title: 'Payment failed',
    body: `${orderId} Paymob payment failed`,
    entity: 'order',
    entityId: orderId,
    dedupe: true,
  }).catch(() => undefined);

  return { ok: true };
}
