# Map verification findings

The customer tracking screen displayed live Johannesburg map tiles and a route-based ETA.

The courier dashboard rendered the Active Deliveries & Navigation section. However, the sandbox has no courier GPS permission, so the in-progress courier route falls back to pickup-to-pickup and displays `0.0 km` / `1 min`, which is misleading. The courier map also showed a generic map area rather than a verified address route when coordinates were unavailable. The next correction must suppress zero-distance estimates, display a clear GPS-required state, and ensure the courier navigation link remains address-based until GPS is granted.
