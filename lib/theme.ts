/**
 * Theme tokens. Native components that can't use className pull from here so
 * there's a single source of truth alongside tailwind.config.js (colors.crm.*).
 *
 * `accent` defaults to the tenant's env accent (config) and is overridden at
 * runtime from org_settings.accent_color via OrgProvider / useAccent().
 */
import { tenantConfig } from "./config";

export const theme = {
  colors: {
    bg: "#0b0f17",
    surface: "#141a24",
    surfaceElevated: "#1c2533",
    border: "#2a3645",
    text: "#f2f6fb",
    textMuted: "#93a1b5",
    accent: tenantConfig.accentColor,
    accentHover: "#38bdf8",
    danger: "#ef5350",
    warning: "#f5a623",
    success: "#34d399",
  },
  radius: { sm: 6, md: 10, lg: 16, xl: 24, pill: 999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    "2xl": 28,
    "3xl": 34,
  },
};

export type Theme = typeof theme;
