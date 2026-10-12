import { Capacitor, registerPlugin } from "@capacitor/core";

type NativeBiometricPlugin = {
  authenticate(): Promise<{ available: boolean; authenticated: boolean; reason?: string }>;
};

const NativeBiometric = registerPlugin<NativeBiometricPlugin>("NativeBiometric");

export async function authenticateWithDevice(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const result = await NativeBiometric.authenticate();
  return result.authenticated;
}
