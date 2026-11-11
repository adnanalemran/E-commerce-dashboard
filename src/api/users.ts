import type { RoleName } from "@/utils/roles";
import type { Paginated } from "./categories";
import { apiRequest } from "./client";
import type { AuthUser } from "./types";

export type UserStatus = AuthUser["status"];

export interface ListUsersParams {
  role?: RoleName;
  status?: UserStatus;
  search?: string;
  page?: number;
  /** Max 100. */
  limit?: number;
}

/** Backend response shape for `GET /admin/users`. */
interface UserListResponse {
  users: AuthUser[];
  pagination: Paginated<AuthUser>["pagination"];
}

export interface CreateUserInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  roles: RoleName[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
}

function toQueryString(params: ListUsersParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/** Admin user management (`/admin/users`, ADMIN & SUPER_ADMIN only). */
export const usersApi = {
  list: async (
    params: ListUsersParams = {},
    signal?: AbortSignal,
  ): Promise<Paginated<AuthUser>> => {
    const data = await apiRequest<UserListResponse>(
      `/admin/users${toQueryString(params)}`,
      { signal },
    );
    return { items: data.users, pagination: data.pagination };
  },

  create: (input: CreateUserInput) =>
    apiRequest<AuthUser>("/admin/users", { method: "POST", body: input }),

  update: (id: string, input: UpdateUserInput) =>
    apiRequest<AuthUser>(`/admin/users/${id}`, { method: "PATCH", body: input }),

  setRoles: (id: string, roles: RoleName[]) =>
    apiRequest<AuthUser>(`/admin/users/${id}/roles`, {
      method: "PUT",
      body: { roles },
    }),

  setStatus: (id: string, status: UserStatus) =>
    apiRequest<AuthUser>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),

  remove: (id: string) =>
    apiRequest<null>(`/admin/users/${id}`, { method: "DELETE" }),
};
