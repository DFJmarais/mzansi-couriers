/**
 * Test script to send a sample WhatsApp message to verify integration
 * Run with: npx ts-node server/whatsapp-send-test.ts
 */

import { sendWhatsAppMessage, sendMessageWithFallback } from './_core/twilio';

async function testWhatsAppIntegration() {
  console.log('🚀 Testing Twilio WhatsApp Integration...\n');

  // Test 1: Send a simple WhatsApp message
  console.log('📱 Test 1: Sending WhatsApp message...');
  const result1 = await sendWhatsAppMessage({
    to: '+27064220217',
    body: 'Hello from Mzansi Couriers! 🚚 This is a test message to verify WhatsApp integration is working correctly.'
  });
  
  if (result1.success) {
    console.log('✅ WhatsApp message sent successfully!');
    console.log(`   Message ID: ${result1.messageId}\n`);
  } else {
    console.log('❌ Failed to send WhatsApp message');
    console.log(`   Error: ${result1.error}\n`);
  }

  // Test 2: Send message with fallback
  console.log('📱 Test 2: Sending message with WhatsApp/SMS fallback...');
  const result2 = await sendMessageWithFallback(
    '+27064220217',
    'Test delivery confirmation: Your package has been confirmed and will be delivered soon! 📦',
    true
  );
  
  if (result2.success) {
    console.log(`✅ Message sent via ${result2.method.toUpperCase()}!`);
    console.log(`   Message ID: ${result2.messageId}\n`);
  } else {
    console.log('❌ Failed to send message');
    console.log(`   Error: ${result2.error}\n`);
  }

  console.log('✨ WhatsApp integration test complete!');
}

testWhatsAppIntegration().catch(console.error);
