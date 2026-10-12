import Foundation

/// Mzansi Couriers does not use cross-app or cross-company advertising tracking.
/// Intentionally contains no AppTrackingTransparency or AdSupport imports.
final class AppTrackingTransparencyHelper {
    static let shared = AppTrackingTransparencyHelper()

    func requestTrackingPermission() {
        // No tracking permission is requested because the app does not track users.
    }
}
