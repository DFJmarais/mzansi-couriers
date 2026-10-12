import UIKit
import Capacitor

/// The storyboard entry point for the Capacitor WebView.
/// CAPBridgeViewController performs the WebView/app loading in its superclass;
/// calling loadApp() a second time can leave the iPad launch screen stuck.
final class BridgeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        bridge?.registerPluginInstance(NativeMapPlugin())
        bridge?.registerPluginInstance(NativeSecureStoragePlugin())
        bridge?.registerPluginInstance(NativeBiometricPlugin())
    }
}
