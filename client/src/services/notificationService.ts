// WhatsApp & SMS Notification Service for South Africa
// Professional, factual messaging without marketing claims

export interface NotificationPayload {
  recipientPhone: string;
  message: string;
  type: 'sms' | 'whatsapp';
  deliveryId?: number;
  courierName?: string;
  estimatedTime?: string;
}

export interface NotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

// ============ WhatsApp Notifications ============
export const sendWhatsAppNotification = async (payload: NotificationPayload): Promise<NotificationResponse> => {
  try {
    // Format: +27 prefix for South Africa
    const formattedPhone = payload.recipientPhone.startsWith('+27') 
      ? payload.recipientPhone 
      : `+27${payload.recipientPhone.slice(1)}`;

    const response = await fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedPhone,
        message: payload.message,
        deliveryId: payload.deliveryId,
        courierName: payload.courierName,
        estimatedTime: payload.estimatedTime
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp notification failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
};

// ============ SMS Notifications ============
export const sendSMSNotification = async (payload: NotificationPayload): Promise<NotificationResponse> => {
  try {
    const formattedPhone = payload.recipientPhone.startsWith('+27') 
      ? payload.recipientPhone 
      : `+27${payload.recipientPhone.slice(1)}`;

    const response = await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedPhone,
        message: payload.message,
        deliveryId: payload.deliveryId
      })
    });

    if (!response.ok) {
      throw new Error(`SMS notification failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
};

// ============ Delivery Status Notifications ============
export const notifyDeliveryStatus = async (
  phone: string,
  status: 'assigned' | 'in-transit' | 'delivered',
  courierName: string,
  estimatedTime?: string,
  method: 'sms' | 'whatsapp' = 'whatsapp'
): Promise<NotificationResponse> => {
  const messages = {
    assigned: `Delivery assigned to ${courierName}. ETA: ${estimatedTime || 'Soon'}. Track: mzansicourier.app`,
    'in-transit': `Package on the way with ${courierName}. Track: mzansicourier.app`,
    delivered: `Delivery completed. Thank you. Rate at: mzansicourier.app`
  };

  return method === 'whatsapp'
    ? sendWhatsAppNotification({
        recipientPhone: phone,
        message: messages[status],
        type: 'whatsapp',
        courierName
      })
    : sendSMSNotification({
        recipientPhone: phone,
        message: messages[status],
        type: 'sms'
      });
};

// ============ Courier Job Notifications ============
export const notifyCourierNewJob = async (
  phone: string,
  pickupLocation: string,
  dropoffLocation: string,
  estimatedEarnings: number,
  method: 'sms' | 'whatsapp' = 'whatsapp'
): Promise<NotificationResponse> => {
  const message = `New job: ${pickupLocation} to ${dropoffLocation}. Earn R${estimatedEarnings}. Accept: mzansicourier.app`;

  return method === 'whatsapp'
    ? sendWhatsAppNotification({
        recipientPhone: phone,
        message,
        type: 'whatsapp'
      })
    : sendSMSNotification({
        recipientPhone: phone,
        message,
        type: 'sms'
      });
};
