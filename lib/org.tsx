/**
 * OrgProvider — loads the tenant's org_settings singleton (company name, brand
 * colors, logo) so the UI can brand itself per tenant without a code change.
 *
 * org_settings is a single row in each tenant DB (uuid PK, exactly one row).
 * We read `select('*').limit(1)` so new columns the web admin adds light up on
 * mobile automatically.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { supabase } from "./supabase";
import { tenantConfig } from "./config";
import { theme } from "./theme";

export type OrgInfo = {
  companyName: string;
  accentColor: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
};

type OrgContextValue = {
  org: OrgInfo;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const DEFAULT_ORG: OrgInfo = {
  companyName: tenantConfig.appName,
  accentColor: tenantConfig.accentColor,
  logoUrl: null,
  phone: null,
  email: null,
};

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export function OrgProvider({ children }: PropsWithChildren) {
  const [org, setOrg] = useState<OrgInfo>(DEFAULT_ORG);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("org_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error || !data) return; // keep defaults on a brand-new tenant

      setOrg({
        companyName:
          (data.company_name as string | null) || tenantConfig.appName,
        accentColor:
          (data.accent_color as string | null) ||
          (data.primary_color as string | null) ||
          tenantConfig.accentColor,
        logoUrl: (data.logo_url as string | null) ?? null,
        phone: (data.company_phone as string | null) ?? null,
        email: (data.company_email as string | null) ?? null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<OrgContextValue>(
    () => ({ org, isLoading, refresh: load }),
    [org, isLoading]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgInfo {
  const ctx = useContext(OrgContext);
  return ctx?.org ?? DEFAULT_ORG;
}

export function useAccent(): string {
  const ctx = useContext(OrgContext);
  return ctx?.org.accentColor ?? theme.colors.accent;
}

/** Returns a function that re-loads org_settings (after editing Settings). */
export function useOrgRefresh(): () => Promise<void> {
  const ctx = useContext(OrgContext);
  return ctx?.refresh ?? (async () => {});
}
