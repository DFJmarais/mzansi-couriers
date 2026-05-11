import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = twilio(accountSid, authToken);

async function sendTestMessage() {
  try {
    console.log('🚀 Sending test WhatsApp message...\n');
    
    const message = await client.messages.create({
      from: `whatsapp:${whatsappNumber}`,
      to: 'whatsapp:+27064220217',
      body: '✅ Mzansi Couriers WhatsApp Integration Test\n\nYour WhatsApp is now connected! You will receive delivery updates here.'
    });
    
    console.log('✅ Message sent successfully!');
    console.log(`📱 Message SID: ${message.sid}`);
    console.log(`📤 Status: ${message.status}`);
    console.log('\n✨ WhatsApp integration is working!');
    
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
  }
}

sendTestMessage();
