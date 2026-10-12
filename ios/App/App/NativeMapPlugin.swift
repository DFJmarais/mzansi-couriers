import Capacitor
import MapKit
import UIKit

@objc(NativeMapPlugin)
public class NativeMapPlugin: CAPPlugin, MKMapViewDelegate {
    @objc func presentRoute(_ call: CAPPluginCall) {
        guard let latitude = call.getDouble("latitude"), let longitude = call.getDouble("longitude") else {
            call.reject("A route destination is required.")
            return
        }
        let coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        DispatchQueue.main.async {
            let mapView = MKMapView(frame: .zero)
            mapView.mapType = .standard
            mapView.showsUserLocation = true
            mapView.setRegion(MKCoordinateRegion(center: coordinate, latitudinalMeters: 1800, longitudinalMeters: 1800), animated: false)
            let pin = MKPointAnnotation()
            pin.coordinate = coordinate
            pin.title = call.getString("title") ?? "Delivery destination"
            mapView.addAnnotation(pin)
            let controller = UIViewController()
            controller.view.backgroundColor = .systemBackground
            controller.view = mapView
            let close = UIButton(type: .system)
            close.setTitle("Done", for: .normal)
            close.backgroundColor = .systemBackground
            close.layer.cornerRadius = 10
            close.addAction(UIAction { _ in controller.dismiss(animated: true) }, for: .touchUpInside)
            close.translatesAutoresizingMaskIntoConstraints = false
            controller.view.addSubview(close)
            NSLayoutConstraint.activate([
                close.topAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.topAnchor, constant: 12),
                close.trailingAnchor.constraint(equalTo: controller.view.trailingAnchor, constant: -16),
                close.widthAnchor.constraint(equalToConstant: 72),
                close.heightAnchor.constraint(equalToConstant: 42)
            ])
            self.bridge?.viewController?.present(controller, animated: true)
            call.resolve()
        }
    }
}
