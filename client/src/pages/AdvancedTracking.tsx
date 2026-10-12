import DeliveryTracking from "./DeliveryTracking";

/**
 * The legacy advanced-tracking screen contained demo route, courier, chat,
 * notification, and rating data. Reuse the real public tracking experience so
 * this route always reads from the verified tracking-code flow instead.
 */
export default function AdvancedTracking() {
  return <DeliveryTracking />;
}
