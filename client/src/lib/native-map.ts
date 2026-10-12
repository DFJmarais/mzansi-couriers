import { Capacitor, registerPlugin } from "@capacitor/core";

type NativeMapPlugin = { presentRoute(options: { latitude: number; longitude: number; title?: string }): Promise<void> };
const NativeMap = registerPlugin<NativeMapPlugin>("NativeMapPlugin");

export async function openNativeRoute(latitude: number, longitude: number, title: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  await NativeMap.presentRoute({ latitude, longitude, title });
  return true;
}
