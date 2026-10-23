import type { SessionUser } from "@/features/auth/api/authSessionQueryOptions"

export const ADMIN_ROLE = "admin"

export const isAdmin = (user: SessionUser | null | undefined) => user?.role === ADMIN_ROLE
