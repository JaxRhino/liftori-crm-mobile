/**
 * Supabase client — single tenant project (auth + data both live here).
 *
 * Unlike LiftOp (auth on MAIN Liftori, data federated per tenant), each Liftori
 * CRM tenant has its OWN Supabase project that holds both auth.users and all the
 * CRM tables. So this app points one client at the tenant from `tenantConfig`,
 * and the same client handles sign-in and every query.
 *
 * Session persists in SecureStore. Anon/publishable key is public-by-design;
 * tenant RLS is the guard (RoofX tenant data is currently anon-open, matching
 * the web CRM — harden before onboarding paying strangers).
 */
import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import { tenantConfig } from "./config";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  tenantConfig.supabaseUrl,
  tenantConfig.supabaseAnonKey,
  {
    auth: {
      storage: ExpoSecureStoreAdapter as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
