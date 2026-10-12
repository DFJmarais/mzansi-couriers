import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

export type CourierLocation = { lat: number; lng: number; accuracy?: number };

export const isNativeCourierApp = () => Capacitor.isNativePlatform();

export async function requestCourierLocation(): Promise<CourierLocation> {
  const permissions = await Geolocation.checkPermissions();
  if (permissions.location !== "granted") {
    const requested = await Geolocation.requestPermissions();
    if (requested.location !== "granted") throw new Error("Location permission is needed to start route guidance.");
  }

  const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 });
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy ?? undefined,
  };
}

export async function captureDeliveryEvidence(): Promise<{ dataUrl: string; fileName: string } | null> {
  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.Base64,
      quality: 82,
      width: 1600,
      correctOrientation: true,
      saveToGallery: false,
      presentationStyle: "fullscreen",
    });

    if (!photo.base64String) return null;
    const format = photo.format || "jpeg";
    return {
      dataUrl: `data:image/${format};base64,${photo.base64String}`,
      fileName: `mzansi-delivery-${Date.now()}.${format}`,
    };
  } catch (error) {
    // Camera cancellation is a normal user action; callers can keep the route open.
    if (String(error).toLowerCase().includes("cancel")) return null;
    throw error;
  }
}

export async function scheduleCourierUpdate(title: string, body: string) {
  try {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") {
      const requested = await LocalNotifications.requestPermissions();
      if (requested.display !== "granted") return false;
    }
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() % 2147480000),
        title,
        body,
        schedule: { at: new Date(Date.now() + 1000) },
        sound: "default",
      }],
    });
    return true;
  } catch {
    return false;
  }
}
