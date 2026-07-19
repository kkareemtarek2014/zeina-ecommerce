import type { ProductSeed } from '@/shared/types/product.types';

/**
 * Sqoosh dummy catalog — seed source for D1 (`pnpm db:seed`).
 * One product type only: squishy stress toys, in 3 sizes (small/medium/large).
 * Deliberately SHORT list — a calm shop, not an endless catalog. Themes are tags.
 * Copy rule: stress-relief first, honest claims only (everyday stress & calm —
 * never medical language). `basePrice` is the landed sourcing cost in EGP (server-only).
 */
export const PRODUCTS: ProductSeed[] = [
  // ── Small (under ~7 cm) — pocket calm ────────────────────────────────
  {
    id: 'sq-001',
    name: 'Mini Bun Trio (3-Pack)',
    category: 'small',
    basePrice: 60,
    description:
      'Three tiny slow-rising buns (5 cm each) — one for your pocket, one for your desk, one for a friend having a rough week. A few quiet squeezes between tasks gives restless hands something soft to do and helps you reset without picking up your phone.',
    images: ['/images/sq-001.svg'],
    rating: 4.8,
    reviewCount: 121,
    inStock: true,
    featured: true,
    tags: ['food', '3-pack', 'best seller'],
  },
  {
    id: 'sq-002',
    name: 'Pocket Dumpling Keychain',
    category: 'small',
    basePrice: 49,
    description:
      'A 6 cm dumpling that clips to your keys or bag, so calm is always within reach. Stuck in traffic, waiting rooms, long queues — squeeze slowly, let it rise back, repeat. Small enough to be totally discreet in class or meetings.',
    images: ['/images/sq-002.svg'],
    rating: 4.7,
    reviewCount: 84,
    inStock: true,
    tags: ['food', 'keychain'],
  },
  {
    id: 'sq-003',
    name: 'Mini Calm Duck',
    category: 'small',
    basePrice: 55,
    description:
      'A 6 cm pocket duck with the most relaxed face in Egypt. The soft, grounding squeeze gives nervous energy somewhere to go — a simple way to bring your attention back to the present moment when your thoughts are racing.',
    images: ['/images/sq-003.svg'],
    rating: 4.6,
    reviewCount: 57,
    inStock: true,
    tags: ['animal'],
  },
  {
    id: 'sq-004',
    name: 'Mini Boba Buddy',
    category: 'small',
    basePrice: 70,
    description:
      'A 7 cm boba cup that squishes down and slowly rises back — just like you after a long day. Keep it next to your laptop for screen-break squeezes: three slow ones before you open your inbox works wonders.',
    images: ['/images/sq-004.svg'],
    rating: 4.7,
    reviewCount: 66,
    inStock: true,
    tags: ['food'],
  },

  // ── Medium (~7–14 cm) — the daily-squeeze heroes ─────────────────────
  {
    id: 'sq-005',
    name: 'Glow Dumpling',
    category: 'medium',
    basePrice: 95,
    compareAtPrice: 199,
    description:
      'Our hero. A 10 cm slow-rising dumpling that glows softly in the dark — squeeze it as part of your wind-down routine and watch it gently glow on your nightstand. Breathe in as you press, breathe out as it rises: a tiny ritual that helps your body slow down before sleep.',
    images: ['/images/sq-005.svg', '/images/sq-005-b.svg'],
    rating: 4.9,
    reviewCount: 203,
    inStock: true,
    featured: true,
    tags: ['glow', 'food', 'slow-rising', 'best seller'],
  },
  {
    id: 'sq-006',
    name: 'Butter Toast',
    category: 'medium',
    basePrice: 100,
    description:
      'An 11 cm slow-rising toast with the softest crumb-like squish. Repetitive squeezing is one of the simplest ways to release everyday tension — this one lives happily next to a keyboard and absorbs deadline stress all day.',
    images: ['/images/sq-006.svg'],
    rating: 4.7,
    reviewCount: 92,
    inStock: true,
    tags: ['food', 'slow-rising'],
  },
  {
    id: 'sq-007',
    name: 'Sleepy Cat',
    category: 'medium',
    basePrice: 105,
    description:
      'A 12 cm cat that is permanently unbothered — squeeze it and borrow some of that energy. The slow, satisfying rebound makes it perfect for unwinding: press, hold for a second, release, and feel your shoulders drop with it.',
    images: ['/images/sq-007.svg'],
    rating: 4.8,
    reviewCount: 148,
    inStock: true,
    featured: true,
    tags: ['animal', 'slow-rising'],
  },
  {
    id: 'sq-008',
    name: 'Axolotl Buddy',
    category: 'medium',
    basePrice: 115,
    description:
      'A 12 cm axolotl with happy little gills and a super-soft body. Fidgety hands during study sessions or long calls? Give them this instead. A calm-down companion that also happens to be the cutest thing on your desk.',
    images: ['/images/sq-008.svg'],
    rating: 4.6,
    reviewCount: 61,
    inStock: true,
    tags: ['animal'],
  },
  {
    id: 'sq-009',
    name: 'Panda Bun',
    category: 'medium',
    basePrice: 110,
    description:
      'A 10 cm panda-faced bun that takes life one bamboo at a time. Its dense, slow-rising squish is deeply satisfying — the kind of tactile comfort that helps you pause, exhale, and come back to whatever you were doing a little lighter.',
    images: ['/images/sq-009.svg'],
    rating: 4.7,
    reviewCount: 75,
    inStock: true,
    tags: ['animal', 'food'],
  },

  // ── Large (15 cm+) — the big squeeze ─────────────────────────────────
  {
    id: 'sq-010',
    name: 'Jumbo Peach Bun',
    category: 'large',
    basePrice: 155,
    description:
      'A 16 cm peach with a deep, two-hand squish. Bigger squishy, bigger release — sink your fingers in after a stressful day and let it rise back slowly while you do the same. Also a brilliant "thinking of you" gift for someone under pressure.',
    images: ['/images/sq-010.svg'],
    rating: 4.8,
    reviewCount: 88,
    inStock: true,
    featured: true,
    tags: ['food', 'slow-rising', 'gift'],
  },
  {
    id: 'sq-011',
    name: 'Jumbo Cloud',
    category: 'large',
    basePrice: 170,
    description:
      'An 18 cm cloud that feels exactly like it looks. Keep it on your bed or reading corner as a calm-down squeeze for heavy evenings — soft enough to hug, slow-rising enough to squish while you decompress from the day.',
    images: ['/images/sq-011.svg'],
    rating: 4.9,
    reviewCount: 112,
    inStock: true,
    tags: ['slow-rising', 'gift'],
  },
  {
    id: 'sq-012',
    name: 'Jumbo Strawberry',
    category: 'large',
    basePrice: 185,
    compareAtPrice: 349,
    description:
      'A 17 cm strawberry with a satisfyingly dense squish and the happiest face in the room. Great for shared spaces — the squishy everyone picks up "just for a second" and puts down two minutes calmer.',
    images: ['/images/sq-012.svg'],
    rating: 4.7,
    reviewCount: 69,
    inStock: true,
    tags: ['food', 'gift'],
  },

  // ── Bundles — pre-packed calm kits (fixed contents, no customization) ─
  {
    id: 'sq-013',
    name: 'Calm Starter Pack (3 Pieces)',
    category: 'medium',
    basePrice: 215,
    description:
      'Your first calm kit, ready-packed: one Glow Dumpling for bedtime wind-downs, one mini bun for your pocket, and one surprise medium squishy for your desk. Three sizes of stress relief — for your bag, your desk, and your nightstand. Contents are pre-packed; every box includes our 60-second calm ritual card.',
    images: ['/images/sq-013.svg'],
    rating: 4.9,
    reviewCount: 94,
    inStock: true,
    featured: true,
    tags: ['bundle', 'gift', 'best seller'],
  },
  {
    id: 'sq-014',
    name: 'Desk Calm Kit (4 Pieces)',
    category: 'medium',
    basePrice: 275,
    description:
      'Four pre-packed squishies to turn any desk into a calmer place: two minis for between-meeting squeezes, one slow-rising medium for deep-focus breaks, and one surprise buddy. Built for exam season, deadline weeks, and open-office chaos. Fixed contents, calm ritual card included.',
    images: ['/images/sq-014.svg'],
    rating: 4.8,
    reviewCount: 52,
    inStock: true,
    tags: ['bundle', 'gift'],
  },
];
