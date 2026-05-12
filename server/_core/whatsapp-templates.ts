/**
 * WhatsApp Message Templates for Delivery Lifecycle
 * Integrated with Twilio WhatsApp API
 */

export const whatsappTemplates = {
  // Customer notifications
  courierAssigned: (courierName: string, courierPhone: string, trackingLink: string) => ({
    body: `Ayoba! Your delivery has been assigned to ${courierName}. Contact: ${courierPhone}. Track here: ${trackingLink}`,
    heading: "Courier Assigned"
  }),

  inTransit: (courierName: string, estimatedTime: string, trackingLink: string) => ({
    body: `${courierName} is on the way with your package. ETA: ${estimatedTime}. Track live: ${trackingLink}`,
    heading: "In Transit"
  }),

  deliveryCompleted: (price: number, rating: boolean) => ({
    body: `Delivery complete! Total: R${price}. ${rating ? "Please rate your courier experience." : "Thank you for using Mzansi Couriers!"}`,
    heading: "Delivery Completed"
  }),

  bookingConfirmation: (deliveryId: string, price: number, trackingLink: string) => ({
    body: `Booking confirmed! Delivery #${deliveryId}. Estimated price: R${price}. Track: ${trackingLink}`,
    heading: "Booking Confirmed"
  }),

  // Courier notifications
  jobAlert: (pickupLocation: string, dropoffLocation: string, price: number) => ({
    body: `New delivery available! From ${pickupLocation} to ${dropoffLocation}. Earn R${price}. Accept now!`,
    heading: "New Job Available"
  }),

  jobAccepted: (customerName: string, pickupAddress: string, trackingLink: string) => ({
    body: `Job accepted! Customer: ${customerName}. Pickup: ${pickupAddress}. Start navigation: ${trackingLink}`,
    heading: "Job Accepted"
  }),

  deliveryPickedUp: (dropoffAddress: string, trackingLink: string) => ({
    body: `Package picked up! Heading to ${dropoffAddress}. Update location: ${trackingLink}`,
    heading: "Package Picked Up"
  }),

  earningsUpdate: (dailyEarnings: number, totalEarnings: number) => ({
    body: `Today's earnings: R${dailyEarnings}. Total this week: R${totalEarnings}. View dashboard for details.`,
    heading: "Earnings Update"
  })
};

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(
  toPhoneNumber: string,
  template: keyof typeof whatsappTemplates,
  args: any[] = []
) {
  try {
    const templateFn = whatsappTemplates[template] as any;
    if (!templateFn) {
      throw new Error(`Template ${template} not found`);
    }

    const message = templateFn(...args);
    
    // Format phone number for WhatsApp (add country code if needed)
    const formattedPhone = toPhoneNumber.startsWith('+') 
      ? toPhoneNumber 
      : `+27${toPhoneNumber.replace(/^0/, '')}`;

    // This would integrate with Twilio sendMessage function
    // For now, return the formatted message for logging
    return {
      success: true,
      phone: formattedPhone,
      template: template as string,
      message
    };
  } catch (error) {
    console.error(`WhatsApp send failed for ${template}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
