import Capacitor
import Security

@objc(NativeSecureStoragePlugin)
public final class NativeSecureStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeSecureStoragePlugin"
    public let jsName = "NativeSecureStorage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
    ]

    private let service = "com.mzansi.couriers.session"

    @objc func get(_ call: CAPPluginCall) {
        let key = call.getString("key") ?? ""
        guard !key.isEmpty else { call.reject("A storage key is required"); return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { call.resolve(["value": NSNull()]); return }
        guard status == errSecSuccess, let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            call.reject("Unable to read secure session storage"); return
        }
        call.resolve(["value": value])
    }

    @objc func set(_ call: CAPPluginCall) {
        let key = call.getString("key") ?? ""
        let value = call.getString("value") ?? ""
        guard !key.isEmpty else { call.reject("A storage key is required"); return }
        guard let data = value.data(using: .utf8) else { call.reject("Invalid secure storage value"); return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        let attributes: [String: Any] = [kSecValueData as String: data,
                                          kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]
        let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            var insert = query
            attributes.forEach { insert[$0.key] = $0.value }
            let insertStatus = SecItemAdd(insert as CFDictionary, nil)
            guard insertStatus == errSecSuccess else { call.reject("Unable to save secure session"); return }
        } else if status != errSecSuccess {
            call.reject("Unable to update secure session"); return
        }
        call.resolve()
    }

    @objc func remove(_ call: CAPPluginCall) {
        let key = call.getString("key") ?? ""
        guard !key.isEmpty else { call.reject("A storage key is required"); return }
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                    kSecAttrService as String: service,
                                    kSecAttrAccount as String: key]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { call.reject("Unable to clear secure session"); return }
        call.resolve()
    }
}
