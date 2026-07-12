# 03 — API Contracts

All endpoints are Next.js Route Handlers under `src/app/api/`, run on the Workers runtime, and return a
**consistent envelope**. Only endpoints backing an existing frontend feature exist here.

---

## 1. Response envelope (every endpoint)

```ts
// shared/contracts/envelope.ts
type ApiOk<T>  = { ok: true;  data: T };
type ApiErr    = { ok: false; error: { code: string; message: string; details?: unknown } };
type ApiResponse<T> = ApiOk<T> | ApiErr;
```

Success → HTTP 200/201 with `{ ok:true, data }`. Failure → matching HTTP status with `{ ok:false,
error }`. Validation errors include `details` = flattened Zod issues.

Error codes: `VALIDATION` (400) · `UNAUTHORIZED` (401) · `FORBIDDEN` (403) · `NOT_FOUND` (404) ·
`CONFLICT` (409) · `PAYLOAD_TOO_LARGE` (413) · `RATE_LIMITED` (429) · `INTERNAL` (500).

`api-client.ts` unwraps `data` on success and throws `AppError(code, message)` on failure, so React
Query hooks get clean data or a typed error.

---

## 2. Auth model

- Session token (opaque, random 32 bytes, base64url) set as **httpOnly, Secure, SameSite=Lax** cookie
  `zaya_session`, ~30-day expiry. DB stores SHA-256 of the token.
- `requireAuth(req)` reads the cookie, hashes, looks up a non-expired `sessions` row, returns the user
  or throws `UNAUTHORIZED`.
- Password hash: PBKDF2-SHA256, 100k iterations, per-user random salt + `PASSWORD_PEPPER` secret,
  stored `base64(salt):base64(hash)`. Verify via constant-time compare.

Public (no auth): all product/category/governorate reads, promo validate, order **create** (guest COD),
order **get by id** (unguessable id), bridal request, review list, register/login/forgot.
Protected: `auth/me`, `auth/logout`, orders **list**, all `account/*`, review **create**.
**Admin** (`requireAdmin` = session + `role==='admin'`): all `/api/admin/**` — full contract in
`08-admin-dashboard.md` §3. `UserDTO` now includes `role` so the client can gate `/admin`.

---

## 3. Products & catalog

### GET `/api/products`
Query: `category?` (slug), `featured?=true`, `sort?` (`newest|price-asc|price-desc|rating`), `q?` (search).
`ProductDTO` (⚠ no `basePrice`):
```ts
type ProductDTO = {
  id: string; name: string; category: string;
  price: number;                 // computed sell price
  compareAtPrice?: number;
  description: string; images: string[];
  rating: number; reviewCount: number;
  inStock: boolean; featured?: boolean; tags?: string[];
};
```
→ `{ ok:true, data: ProductDTO[] }`. Sorting mirrors `sortProducts.ts`; if `q` present, behaves like
search (name/category/tags match, cap 8). Backs `getProducts`, `getProductsByCategory`,
`getFeaturedProducts`.

> **Storefront reads only `status='published'`** and stock-aware products once enhancements land
> (`10` §4). `ProductDTO` gains `slug` and an out-of-stock signal; admin uses `AdminProductDTO` with the
> full status/stock/SEO fields. Admin enhancement endpoints (inventory, bulk, duplicate, import/export,
> media, notifications, audit-log, activity) are in `08` + `10`.

> **Sourcing/pricing (`11`):** `price` is computed by the landed-cost engine when the `dynamic_pricing`
> flag is ON (else the flat model) — cost inputs are never serialized. `ProductDTO` also carries
> `fulfilmentType`, a `shippingEta` label (1–2 days vs 2–3 weeks), and `preorder?` when OOS + enabled.
> Admin adds `POST /api/admin/import/temu` (paste URL → draft product), `/api/admin/bundles` CRUD, and
> pre-order management — full spec in `11-sourcing-pricing-merchandising.md`.

### GET `/api/products/[id]` → `ProductDTO` or 404 `NOT_FOUND`. Backs `getProductById`.
### GET `/api/products/[id]/related?limit=4` → `ProductDTO[]` (same category, excludes self). Backs `getRelatedProducts`.
### GET `/api/products/new?limit=8` → `ProductDTO[]` newest first. Backs `getNewArrivals`.
### GET `/api/products/search?q=` → `ProductDTO[]` (≤8; empty `q` → `[]`). Backs `searchProducts`.
### GET `/api/categories` → `Category[]` (`slug,name,image,seoDescription`). Backs `getCategories`.
### GET `/api/governorates` → `{ id,name,zone }[]`. Backs checkout select + shipping.

---

## 4. Promo validation

### POST `/api/promos/validate`
Req: `{ code: string; subtotal: number }`.
Res: `{ valid: boolean; discount?: number; error?: string }` — mirrors `validatePromoCode()` exactly
(invalid code, min-order-value message, percentage vs fixed). Server is authoritative; the cart store's
`applyCoupon` calls this instead of the local function. Discount is recomputed server-side at order time
regardless.

---

## 5. Orders

### POST `/api/orders`  *(guest allowed; attaches user_id if session present)*
Req (`CreateOrderInput`, validated with `checkoutSchema` + items):
```ts
{
  items: { productId: string; quantity: number }[];   // 1..10 each
  address: { fullName; phone; governorate; city; street; notes? };  // checkoutSchema fields
  paymentMethod: 'cod' | 'card' | 'wallet';   // card/wallet → Paymob (see 09 Part A)
  promoCode?: string;
  note?: string;
}
```
For `card`/`wallet` the order is created `payment_status='pending'` and the client is then sent through
the Paymob flow (`09`). For `cod` behavior is unchanged.
Server: loads products → recomputes `unit_price` via pricing service → `subtotal` → validates promo →
`shipping` via shipping service → `total`. **Client-sent prices are ignored.** Inserts `orders` +
`order_items`, generates `ZN-…` id.
Res 201: `OrderDTO`:
```ts
type OrderDTO = {
  id; createdAt; status;
  items: { productId; name; image; unitPrice; quantity }[];
  address: { fullName; phone; governorate; city; street; notes? };
  paymentMethod: 'cod' | 'card' | 'wallet';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal; discount; shipping; total; promoCode?; note?;
  tracking?: { number: string; url: string; status: OrderStatus };  // from Bosta shipment (see 09)
};
```
Errors: `VALIDATION` (bad phone/governorate/items), `NOT_FOUND` (unknown product), `CONFLICT`
(out of stock). Backs `CheckoutForm` → replaces `ordersStore.placeOrder`.

### GET `/api/orders/[id]` → `OrderDTO` or 404. Backs `/order/[id]` + confirmation.
### GET `/api/orders` *(auth)* → `OrderDTO[]` for the session user, newest first. Backs account orders.

---

## 6. Bridal requests (with R2 upload)

### POST `/api/bridal-requests`  — `multipart/form-data`
Fields: `fullName`, `phone`, `weddingDate?`, `description`, `file?` (image/video ≤ 25 MB — mirrors
`bridalRequestSchema`). Server validates, and if a file is present, `PUT`s it to R2 (`UPLOADS`) under
`bridal/{id}/{filename}`, stores `file_key`. Res 201: `{ id, status, createdAt }`.
Errors: `VALIDATION`, `PAYLOAD_TOO_LARGE` (413). Backs `BridalRequestForm` → replaces
`bridalRequestsStore.submitRequest` (now a real upload).

---

## 7. Reviews

### GET `/api/reviews?productId=` → 
```ts
{ summary: { average: number; count: number; breakdown: Record<1|2|3|4|5, number> };
  items: { id; authorName; rating; comment; helpful; createdAt }[] }
```
Backs `ProductReviews` (replaces its hardcoded array + "4.8/124" summary + rating bars).
### POST `/api/reviews` *(auth)* — Req `{ productId, rating:1..5, comment }`. Inserts, recomputes
product `rating`/`reviewCount`, returns the created review. *(No submission UI exists yet — endpoint is
provided for full scope; wire a form later. Documented so it isn't invented ad-hoc.)*

---

## 8. Auth endpoints

### POST `/api/auth/register` — Req `registerSchema` `{ name, email, password }`.
409 `CONFLICT` if email exists. On success: create user (hashed), create session, `Set-Cookie`,
return `UserDTO`. Backs `RegisterForm` → replaces `authService.register`.

### POST `/api/auth/login` — Req `loginSchema` `{ email, password }`.
401 `UNAUTHORIZED` on bad credentials (generic message). On success: create session, `Set-Cookie`,
return `UserDTO`. Backs `LoginForm` → replaces `authService.login`.

### POST `/api/auth/logout` *(auth)* — deletes session row, clears cookie → `{ ok:true }`.
### GET `/api/auth/me` — returns `UserDTO` if session valid, else 401. Client uses it to hydrate
`auth.store` on load (replaces trusting localStorage).
### POST `/api/auth/forgot-password` — Req `forgotPasswordSchema` `{ email }`. Always returns
`{ ok:true }` (no user enumeration); if the account exists, queue/send reset (stubbed until email
provider chosen). Backs `ForgotPasswordForm` → replaces `authService.resetPassword`.

`UserDTO = { id, email, name, phone?, role }` (`role: 'customer' | 'admin'`).

---

## 9. Account

### GET `/api/account/profile` *(auth)* → `{ fullName, phone, email }` (derived from user). 
### PUT `/api/account/profile` *(auth)* — Req `{ fullName, phone }` → updated profile. Email immutable
here. Backs `ProfileForm` → replaces `profileStore`.

### GET `/api/account/addresses` *(auth)* → `SavedAddress[]` (`id,label,governorate,city,street`).
### POST `/api/account/addresses` *(auth)* — Req `{ label, governorate, city, street }` → created address.
### DELETE `/api/account/addresses/[id]` *(auth)* → `{ ok:true }` (404 if not owned). Backs `AddressBook`.

### GET `/api/account/favorites` *(auth)* → `{ ids: string[] }`.
### PUT `/api/account/favorites` *(auth)* — Req `{ ids: string[] }` replaces the set (used to sync the
guest localStorage set on login). Backs favorites store sync.

### GET `/api/account/wallet` *(auth, flag-gated `wallet`)* →
`{ balance: number; transactions: { id,type,amount,description,createdAt }[] }`. If the `wallet` flag is
off, route returns 404 (consistent with middleware). Backs `MyWallet` → replaces `walletStore`.

---

## 10. Validation & reuse

- Every request body is parsed with a **Zod schema from `shared/contracts`**, reusing the existing
  feature schemas (`loginSchema`, `registerSchema`, `forgotPasswordSchema`, `checkoutSchema`,
  `bridalRequestSchema`) so client and server validate identically.
- Egyptian phone regex `^01[0125][0-9]{8}$` and governorate-membership checks are enforced server-side
  too (never trust the client).
- Response DTOs are Zod-inferred types exported from `shared/contracts`, imported by hooks for full
  end-to-end typing (no `any`).

---

## 11. Endpoint → frontend map (quick index)

| Frontend seam | Endpoint(s) |
| --- | --- |
| `products.service.getProducts/ByCategory/Featured` | `GET /api/products[?category&featured&sort]` |
| `getProductById` | `GET /api/products/[id]` |
| `getRelatedProducts` | `GET /api/products/[id]/related` |
| `getNewArrivals` | `GET /api/products/new` |
| `searchProducts` | `GET /api/products/search` |
| `getCategories` | `GET /api/categories` |
| checkout governorate/shipping | `GET /api/governorates` |
| `cart.store.applyCoupon` | `POST /api/promos/validate` |
| `ordersStore.placeOrder` | `POST /api/orders` |
| `/order/[id]`, confirmation | `GET /api/orders/[id]` |
| account orders list | `GET /api/orders` |
| `bridalRequestsStore.submitRequest` | `POST /api/bridal-requests` |
| `ProductReviews` | `GET /api/reviews?productId=` (`POST` future) |
| `authService.*` | `POST /api/auth/register\|login\|forgot-password`, `logout`, `GET /me` |
| `profileStore` | `GET/PUT /api/account/profile` |
| `addressesStore` | `GET/POST /api/account/addresses`, `DELETE /[id]` |
| `favoritesStore` | `GET/PUT /api/account/favorites` |
| `walletStore` | `GET /api/account/wallet` |
| admin dashboard (all modules) | `/api/admin/**` — see `08-admin-dashboard.md` §3 |

---

## 12. Admin API

The admin dashboard endpoints (`/api/admin/stats`, `/products`, `/categories`, `/orders`, `/users`,
`/governorates`, `/shipping-zones`, `/promos`, `/bridal-requests`, `/settings`) are specified in full —
with paginated list shapes, `AdminProductDTO`/`AdminUserDTO`, image upload, and status-transition rules —
in **`08-admin-dashboard.md` §3**. They use the same envelope and are all `requireAdmin`.

## 13. Payments & Shipping webhooks (Paymob & Bosta)

Full flow, HMAC verification, credentials, and status mapping are in **`09-integrations-bosta-paymob.md`**.
Endpoint summary:

- `POST /api/payments/paymob/intention` *(order flow)* — `{ orderId }` → `{ clientSecret, publicKey, checkoutUrl }`.
- `GET /api/payments/[orderId]` *(owner)* — payment status (confirmation page polls this).
- `POST /api/webhooks/paymob` *(public, **HMAC-SHA512 verified**, idempotent)* — source of truth for payment status.
- `POST /api/webhooks/bosta` *(public, signature/secret verified, idempotent)* — delivery status updates → `OrderStatus`.
- Admin: `POST/GET /api/admin/orders/[id]/shipment` (create/refresh Bosta delivery), `GET /api/admin/shipments`.

Webhooks bypass session auth but **must** verify the provider signature before mutating anything.
