/**
 * client-config.js
 * ----------------
 * Central configuration for white-label / dedicated client instances.
 * All client-specific behaviour is controlled here via env vars.
 *
 * For fingoh.ai production: defaults are used (VITE_ vars not set).
 * For client instances: set VITE_ vars in Vercel per deployment.
 *
 * NEVER hardcode client-specific values in App.jsx or other components.
 * All customisation must flow through this config.
 */

// ── Identity ──────────────────────────────────────────────────────────────────
export const CLIENT_NAME          = import.meta.env.VITE_APP_NAME          || "Fingoh";
export const CLIENT_DOMAIN        = import.meta.env.VITE_APP_DOMAIN        || "fingoh.ai";
export const CLIENT_SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL     || "hello@fingoh.ai";
export const CLIENT_LOGO_URL      = import.meta.env.VITE_LOGO_URL          || "/Fingoh_Black.png";
export const CLIENT_LOGO_WHITE    = import.meta.env.VITE_LOGO_WHITE_URL    || "/Fingoh_White.png";
export const CLIENT_FAVICON       = import.meta.env.VITE_FAVICON_URL       || "/favicon.ico";
export const SHOW_FINGOH_BADGE    = import.meta.env.VITE_SHOW_FINGOH_BADGE !== "false";

// ── Branding Colors ───────────────────────────────────────────────────────────
export const BRAND_PRIMARY   = import.meta.env.VITE_BRAND_PRIMARY   || "#26215C";
export const BRAND_SECONDARY = import.meta.env.VITE_BRAND_SECONDARY || "#4338A0";
export const BRAND_ACCENT    = import.meta.env.VITE_BRAND_ACCENT    || "#ED1C24";

// ── Feature Flags ─────────────────────────────────────────────────────────────
export const FEATURES = {
  deepIei:          import.meta.env.VITE_FEATURE_DEEP_IEI      !== "false",
  agentOutreach:    import.meta.env.VITE_FEATURE_AGENT         === "true",
  organiserModule:  import.meta.env.VITE_FEATURE_ORGANISER     !== "false",
  meetingMatch:     import.meta.env.VITE_FEATURE_MEETINGS      !== "false",
  pharmaIntel:      import.meta.env.VITE_FEATURE_PHARMA_INTEL  !== "false",
  walkInCapture:    import.meta.env.VITE_FEATURE_WALK_IN       !== "false",
  csvExport:        import.meta.env.VITE_FEATURE_CSV_EXPORT    !== "false",
  crmIntegration:   import.meta.env.VITE_FEATURE_CRM           !== "false",
  customFields:     import.meta.env.VITE_FEATURE_CUSTOM_FIELDS === "true",
};

// ── Industry Vertical ─────────────────────────────────────────────────────────
export const CLIENT_VERTICAL = import.meta.env.VITE_CLIENT_VERTICAL || "pharma";

// ── Apply branding to document ────────────────────────────────────────────────
export function applyBranding() {
  document.title = CLIENT_NAME;
  const favicon = document.querySelector("link[rel='icon']");
  if (favicon) favicon.href = CLIENT_FAVICON;
  const root = document.documentElement;
  root.style.setProperty("--brand-primary",   BRAND_PRIMARY);
  root.style.setProperty("--brand-secondary", BRAND_SECONDARY);
  root.style.setProperty("--brand-accent",    BRAND_ACCENT);
}

// ── Check feature ─────────────────────────────────────────────────────────────
export function isFeatureEnabled(feature) {
  return FEATURES[feature] ?? false;
}

export default {
  name:           CLIENT_NAME,
  domain:         CLIENT_DOMAIN,
  supportEmail:   CLIENT_SUPPORT_EMAIL,
  logoUrl:        CLIENT_LOGO_URL,
  logoWhite:      CLIENT_LOGO_WHITE,
  showFingohBadge:SHOW_FINGOH_BADGE,
  brandPrimary:   BRAND_PRIMARY,
  brandSecondary: BRAND_SECONDARY,
  vertical:       CLIENT_VERTICAL,
  features:       FEATURES,
  applyBranding,
  isFeatureEnabled,
};
