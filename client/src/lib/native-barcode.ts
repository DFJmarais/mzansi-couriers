import { BrowserMultiFormatReader } from "@zxing/browser";

export async function decodeParcelCodeFromFile(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose a photo of the parcel code.");
  const url = URL.createObjectURL(file);
  try {
    const reader = new BrowserMultiFormatReader();
    const result = await reader.decodeFromImageUrl(url);
    return result.getText().trim() || null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
