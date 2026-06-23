export const env = {
  gatewayBaseUrl: process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:5003/admin/management",
  portalName: process.env.NEXT_PUBLIC_PORTAL_NAME ?? "SeaBaas Admin Portal",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@gapeiro.dev",
};
