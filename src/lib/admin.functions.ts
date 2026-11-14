import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Akses ditolak: hanya admin.");
}

export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; active: boolean }) => {
    if (typeof input?.userId !== "string" || typeof input?.active !== "boolean") throw new Error("Data tidak valid");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Anda tidak dapat menonaktifkan akun sendiri.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.active ? "none" : "876000h",
    });
    if (error) throw new Error(error.message);
    const { error: pErr } = await supabaseAdmin.from("profiles").update({ is_active: data.active }).eq("id", data.userId);
    if (pErr) throw new Error(pErr.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (typeof input?.userId !== "string") throw new Error("Data tidak valid");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Anda tidak dapat menghapus akun sendiri.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Remove the user's store (and its products) before deleting the account.
    await supabaseAdmin.from("umkm").delete().eq("owner_id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
