/**
 * Seed-only user shape (plaintext password for hashing during `pnpm db:seed`).
 * Never sent to the browser — public identity is `UserDTO`.
 */
export interface SeedUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  password: string;
}

/** Seed accounts for D1 (`pnpm db:seed`). */
export const SEED_USERS: SeedUser[] = [
  {
    id: 'user_1',
    email: 'test@example.com',
    name: 'Test User',
    phone: '01000000000',
    password: 'password123',
  },
];
