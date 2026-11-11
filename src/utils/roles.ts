/** Mirrors `ROLE_NAMES` in the backend (`src/config/roles.ts`). */
export const ROLE_NAMES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CUSTOMER"] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

/** Roles allowed to manage users. */
export const ADMIN_ROLES: readonly RoleName[] = ["SUPER_ADMIN", "ADMIN"];

/** Roles allowed to manage the catalog. */
export const STAFF_ROLES: readonly RoleName[] = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

/** True when `roles` contains at least one of `allowed`. */
export function hasAnyRole(
  roles: readonly string[] | undefined,
  allowed: readonly string[],
): boolean {
  return Boolean(roles?.some((role) => allowed.includes(role)));
}

/** Highest-privilege role first, for display. */
export function primaryRole(roles: readonly string[]): RoleName | undefined {
  return ROLE_NAMES.find((role) => roles.includes(role));
}
