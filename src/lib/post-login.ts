import { supabase } from "@/integrations/supabase/client";

/** Accept only same-origin relative paths as post-login destinations. */
export function safeRedirect(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (url.pathname.startsWith("/auth")) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

export async function homeForCurrentUser(): Promise<"/admin" | "/toko" | "/dashboard"> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return "/dashboard";
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id);
    if (error) return "/dashboard";
    const roles = (data ?? []).map((r) => r.role);
    if (roles.includes("admin")) return "/admin";
    if (roles.includes("umkm")) return "/toko";
  } catch {
    return "/dashboard";
  }
  return "/dashboard";
}
