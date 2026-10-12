import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { getLoginUrl } from "@/const";
import { setNativeSessionToken } from "./native-secure-storage";

let authListenersReady = false;

async function prepareNativeAuthListeners(): Promise<void> {
  if (!Capacitor.isNativePlatform() || authListenersReady) return;
  authListenersReady = true;

  await Browser.addListener("browserFinished", () => {
    window.dispatchEvent(new Event("mzansi-auth-returned"));
  });

  await App.addListener("appUrlOpen", ({ url }) => {
    if (!url.toLowerCase().includes("auth")) return;
    const token = new URL(url).searchParams.get("token");
    void (async () => {
      if (token) await setNativeSessionToken(token);
      await Browser.close();
      window.dispatchEvent(new Event("mzansi-auth-returned"));
    })();
  });
}

/**
 * Starts the existing Manus OAuth flow without sending a native user to the
 * device's default browser. On the web deployment, the existing full-page
 * redirect remains the correct fallback.
 */
export async function startAuthFlow(): Promise<void> {
  const url = getLoginUrl({ native: Capacitor.isNativePlatform() });

  if (Capacitor.isNativePlatform()) {
    await prepareNativeAuthListeners();
    await Browser.open({
      url,
      presentationStyle: "popover",
      toolbarColor: "#022c22",
    });
    return;
  }

  window.location.assign(url);
}

export async function closeAuthFlow(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.close();
    } catch {
      // The browser may already have been dismissed by the operating system.
    }
  }
}
