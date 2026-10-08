export type LocalShoreRole = "customer" | "seller" | "delivery_partner" | "admin";
export type RoleStatus = "pending" | "active" | "suspended" | "revoked";
export interface UserRoleRecord {
  user_id: string;
  role: LocalShoreRole;
  status: RoleStatus;
}
