// Role definitions and utilities

export type UserRole = "SUBSCRIBER" | "ADMIN" | "SUPER_ADMIN"

export const ROLES = {
  SUBSCRIBER: "SUBSCRIBER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const

// Check if user has a specific role
export function hasRole(userRole: string | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    SUBSCRIBER: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  }
  
  return roleHierarchy[userRole as UserRole] >= roleHierarchy[requiredRole]
}

// Check if user is admin or super admin
export function isAdmin(userRole: string | undefined): boolean {
  return hasRole(userRole, ROLES.ADMIN)
}

// Check if user is super admin
export function isSuperAdmin(userRole: string | undefined): boolean {
  return userRole === ROLES.SUPER_ADMIN
}

// Check if user can manage admins
export function canManageAdmins(userRole: string | undefined): boolean {
  return isSuperAdmin(userRole)
}

// Check if user can manage roles
export function canManageRoles(userRole: string | undefined): boolean {
  return isSuperAdmin(userRole)
}

