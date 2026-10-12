import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  checkLocation: vi.fn(),
  requestLocation: vi.fn(),
  getCurrentPosition: vi.fn(),
  getPhoto: vi.fn(),
  checkNotifications: vi.fn(),
  requestNotifications: vi.fn(),
  schedule: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: mocks.isNativePlatform } }));
vi.mock("@capacitor/geolocation", () => ({ Geolocation: {
  checkPermissions: mocks.checkLocation,
  requestPermissions: mocks.requestLocation,
  getCurrentPosition: mocks.getCurrentPosition,
} }));
vi.mock("@capacitor/camera", () => ({ Camera: { getPhoto: mocks.getPhoto }, CameraResultType: { Base64: "base64" }, CameraSource: { Camera: "camera" } }));
vi.mock("@capacitor/local-notifications", () => ({ LocalNotifications: {
  checkPermissions: mocks.checkNotifications,
  requestPermissions: mocks.requestNotifications,
  schedule: mocks.schedule,
} }));

describe("native courier capabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.checkLocation.mockResolvedValue({ location: "granted" });
    mocks.getCurrentPosition.mockResolvedValue({ coords: { latitude: -26.2041, longitude: 28.0473, accuracy: 8 } });
    mocks.checkNotifications.mockResolvedValue({ display: "granted" });
    mocks.schedule.mockResolvedValue(undefined);
  });

  it("recognises the native iOS runtime", async () => {
    const { isNativeCourierApp } = await import("./native-courier");
    expect(isNativeCourierApp()).toBe(true);
  });

  it("requests and returns a courier location", async () => {
    const { requestCourierLocation } = await import("./native-courier");
    await expect(requestCourierLocation()).resolves.toEqual({ lat: -26.2041, lng: 28.0473, accuracy: 8 });
    expect(mocks.getCurrentPosition).toHaveBeenCalledWith(expect.objectContaining({ enableHighAccuracy: true }));
  });

  it("captures a proof photo as a data URL", async () => {
    mocks.getPhoto.mockResolvedValue({ base64String: "abc123", format: "jpeg" });
    const { captureDeliveryEvidence } = await import("./native-courier");
    await expect(captureDeliveryEvidence()).resolves.toEqual(expect.objectContaining({ dataUrl: "data:image/jpeg;base64,abc123" }));
  });

  it("schedules a local route update when notifications are allowed", async () => {
    const { scheduleCourierUpdate } = await import("./native-courier");
    await expect(scheduleCourierUpdate("Route started", "Your run is ready.")).resolves.toBe(true);
    expect(mocks.schedule).toHaveBeenCalledWith(expect.objectContaining({ notifications: expect.any(Array) }));
  });
});
