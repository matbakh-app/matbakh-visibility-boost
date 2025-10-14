export type Role = "viewer" | "owner" | "partner" | "admin" | "super_admin";

export function can(role: Role, need: Role | Role[]) {
  const order: Role[] = ["viewer", "owner", "partner", "admin", "super_admin"];
  const idx = (r: Role) => order.indexOf(r);
  const req = Array.isArray(need) ? need : [need];
  return (userRole: Role) => idx(userRole) >= Math.min(...req.map(idx));
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  const order: Role[] = ["viewer", "owner", "partner", "admin", "super_admin"];
  return order.indexOf(userRole) >= order.indexOf(requiredRole);
}

export function getRolePermissions(role: Role): string[] {
  const permissions: Record<Role, string[]> = {
    viewer: ['read_own_content'],
    owner: ['read_own_content', 'manage_own_vc', 'post_own_actions', 'manage_own_profile'],
    partner: ['read_own_content', 'manage_partner_embeds', 'view_partner_campaigns', 'view_partner_reports', 'partner_credits_read'],
    admin: ['read_all_owners', 'read_all_partners', 'view_ops_dashboards', 'manage_configuration', 'partner_credits_grant', 'partner_credits_adjust', 'partner_credits_policy_update', 'partner_credits_ledger_view'],
    super_admin: ['all_permissions', 'manage_feature_flags', 'manage_allowed_origins', 'manage_secrets', 'impersonate_users', 'partner_credits_default_policies']
  };
  
  return permissions[role] || [];
}