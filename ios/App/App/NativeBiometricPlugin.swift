import Capacitor
import LocalAuthentication

@objc(NativeBiometricPlugin)
public class NativeBiometricPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeBiometricPlugin"
    public let jsName = "NativeBiometric"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise)
    ]

    @objc func authenticate(_ call: CAPPluginCall) {
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            call.resolve(["available": false, "authenticated": false, "reason": error?.localizedDescription ?? "Device authentication is unavailable."])
            return
        }

        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Unlock Mzansi Couriers to protect your delivery and account information.") { success, evaluationError in
            DispatchQueue.main.async {
                call.resolve([
                    "available": true,
                    "authenticated": success,
                    "reason": evaluationError?.localizedDescription as Any
                ])
            }
        }
    }
}
