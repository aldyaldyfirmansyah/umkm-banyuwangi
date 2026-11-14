import { supabase } from "@/integrations/supabase/client";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function validateImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return "File harus berupa gambar (JPG, PNG, atau WEBP).";
  if (file.size > MAX_IMAGE_BYTES) return "Ukuran gambar maksimal 5 MB.";
  return null;
}

/** Uploads an image into the signed-in user's own folder and returns a long-lived link to it. */
export async function uploadImage(file: File, folder: "products" | "logos" | "banners"): Promise<string> {
  const problem = validateImage(file);
  if (problem) throw new Error(problem);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Silakan masuk terlebih dahulu.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${auth.user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error("Gagal mengunggah gambar: " + error.message);
  const { data, error: signError } = await supabase.storage.from("media").createSignedUrl(path, TEN_YEARS);
  if (signError || !data) throw new Error("Gagal menyiapkan tautan gambar.");
  return data.signedUrl;
}
