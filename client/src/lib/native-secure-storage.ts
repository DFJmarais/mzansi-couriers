import { Capacitor, registerPlugin } from "@capacitor/core";

type NativeSecureStoragePlugin = {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
};

const SecureStorage = registerPlugin<NativeSecureStoragePlugin>("NativeSecureStorage");
const SESSION_KEY = "nativeSessionToken";

export async function getNativeSessionToken(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return localStorage.getItem(SESSION_KEY);
  try {
    const result = await SecureStorage.get({ key: SESSION_KEY });
    return result.value || null;
  } catch {
    return localStorage.getItem(SESSION_KEY);
  }
}

export async function setNativeSessionToken(value: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(SESSION_KEY, value);
    return;
  }
  try {
    await SecureStorage.set({ key: SESSION_KEY, value });
    localStorage.removeItem(SESSION_KEY);
  } catch {
    localStorage.setItem(SESSION_KEY, value);
  }
}

export async function clearNativeSessionToken(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
  if (!Capacitor.isNativePlatform()) return;
  try {
    await SecureStorage.remove({ key: SESSION_KEY });
  } catch {
    // The native store may already be empty.
  }
}

export { SESSION_KEY };
