# Zapier Webhook Setup Guide for Mzansi Couriers

## Overview
This guide shows you how to create 6 Zapier Zaps that will automatically trigger when events happen in your Mzansi Couriers app.

---

## **Step 1: Get Your Zapier Webhook URLs**

### **For Each Webhook, Follow These Steps:**

#### **Webhook 1: Payment Success**

1. Go to **Zapier.com** → Click **"Create"** (top-left)
2. Search for **"Webhooks by Zapier"** in the "Choose an app" field
3. Click **"Webhooks by Zapier"**
4. Select **"Catch Raw Hook"** (this generates a unique webhook URL)
5. Click **"Continue"**
6. You'll see a **unique webhook URL** like:
   ```
   https://hooks.zapier.com/hooks/catch/123456/abc123xyz/
   ```
7. **Copy this URL** - This is your `ZAPIER_PAYMENT_SUCCESS_URL`

#### **Webhook 2: Delivery Status Changed**

1. Create a new Zap (click **"Create"** again)
2. Repeat steps 2-7 above
3. You'll get a different webhook URL - This is your `ZAPIER_DELIVERY_STATUS_URL`

#### **Webhook 3: Courier Assigned**

1. Create a new Zap
2. Repeat steps 2-7
3. Copy the webhook URL - This is your `ZAPIER_COURIER_ASSIGNED_URL`

#### **Webhook 4: Daily Earnings Summary**

1. Create a new Zap
2. Repeat steps 2-7
3. Copy the webhook URL - This is your `ZAPIER_EARNINGS_SUMMARY_URL`

#### **Webhook 5: Support Ticket Created**

1. Create a new Zap
2. Repeat steps 2-7
3. Copy the webhook URL - This is your `ZAPIER_SUPPORT_TICKET_URL`

#### **Webhook 6: Weekly Payout Report**

1. Create a new Zap
2. Repeat steps 2-7
3. Copy the webhook URL - This is your `ZAPIER_PAYOUT_REPORT_URL`

---

## **Step 2: Configure Each Zap**

### **Zap 1: Payment Success → WhatsApp + Email + Google Sheets**

**Trigger Setup:**
1. In your "Payment Success" Zap, click **"Continue"** after setting up the webhook
2. You'll see a test section - Leave it for now
3. Click **"Continue"** to move to Actions

**Action 1: Send WhatsApp to Customer**
1. Click **"+ Add Step"**
2. Search for **"Twilio"** (or your WhatsApp provider)
3. Select **"Send WhatsApp Message"**
4. Connect your Twilio account (if not already connected)
5. Configure:
   - **To:** `{{data.customerPhone}}`
   - **Message:** "Your parcel has been confirmed! Courier {{data.courierName}} will deliver it by {{data.estimatedDeliveryTime}}. Track: [link]"

**Action 2: Send WhatsApp to Courier**
1. Click **"+ Add Step"**
2. Search for **"Twilio"**
3. Select **"Send WhatsApp Message"**
4. Configure:
   - **To:** `{{data.courierPhone}}`
   - **Message:** "New delivery assigned! Pick up from {{data.pickupLocation}} and deliver to {{data.deliveryLocation}}. Earn: R{{data.courierEarnings}}"

**Action 3: Send Email to Customer**
1. Click **"+ Add Step"**
2. Search for **"Gmail"**
3. Select **"Send Email"**
4. Connect your Gmail account
5. Configure:
   - **To:** `{{data.customerEmail}}`
   - **Subject:** "Delivery Confirmed - Parcel #{{data.parcelId}}"
   - **Body:** "Your delivery has been confirmed and assigned to {{data.courierName}}. Estimated delivery: {{data.estimatedDeliveryTime}}"

**Action 4: Log to Google Sheets**
1. Click **"+ Add Step"**
2. Search for **"Google Sheets"**
3. Select **"Create Spreadsheet Row"**
4. Connect your Google account
5. Configure:
   - **Spreadsheet:** Create one called "Mzansi Couriers - Payments"
   - **Worksheet:** "Sheet1"
   - **Columns:**
     - Payment ID: `{{data.paymentId}}`
     - Customer: `{{data.customerEmail}}`
     - Amount: `{{data.amount}}`
     - Courier: `{{data.courierName}}`
     - Status: "Completed"
     - Timestamp: `{{data.timestamp}}`

**Action 5: Send Slack Alert (Optional)**
1. Click **"+ Add Step"**
2. Search for **"Slack"**
3. Select **"Send Channel Message"**
4. Connect your Slack workspace
5. Configure:
   - **Channel:** #payments (or create one)
   - **Message:** "✅ Payment processed: R{{data.amount}} | Courier: {{data.courierName}} | Parcel: {{data.parcelId}}"

6. Click **"Publish"** to activate the Zap

---

### **Zap 2: Delivery Status Changed → WhatsApp Update**

**Trigger Setup:**
1. Use your "Delivery Status Changed" webhook URL
2. Click **"Continue"**

**Actions:**
1. **Send WhatsApp to Customer:**
   - **To:** `{{data.customerPhone}}`
   - **Message:** "Your delivery status: {{data.newStatus}} | Location: {{data.location}} | ETA: {{data.estimatedArrival}}"

2. **Update Google Sheets:**
   - Add row to "Mzansi Couriers - Deliveries" spreadsheet
   - Columns: Parcel ID, Status, Location, Timestamp

3. Click **"Publish"**

---

### **Zap 3: Courier Assigned → Notifications**

**Trigger Setup:**
1. Use your "Courier Assigned" webhook URL
2. Click **"Continue"**

**Actions:**
1. **Send WhatsApp to Courier:**
   - **To:** `{{data.courierPhone}}`
   - **Message:** "New delivery! {{data.pickupLocation}} → {{data.deliveryLocation}} | Est. time: {{data.estimatedDeliveryTime}} | Earn: R{{data.courierEarnings}}"

2. **Send Email to Customer:**
   - **To:** `{{data.customerEmail}}`
   - **Subject:** "Your courier is {{data.courierName}}"
   - **Body:** "Courier {{data.courierName}} (Rating: {{data.courierRating}}⭐) has been assigned to your delivery"

3. Click **"Publish"**

---

### **Zap 4: Daily Earnings Summary → Email + WhatsApp**

**Trigger Setup:**
1. Use your "Daily Earnings Summary" webhook URL
2. Click **"Continue"**

**Actions:**
1. **Send Email to Courier:**
   - **To:** `{{data.courierEmail}}`
   - **Subject:** "Daily Earnings Summary - {{data.date}}"
   - **Body:** "Deliveries: {{data.totalDeliveries}} | Earnings: R{{data.totalEarnings}} | Bonus: R{{data.bonusEarnings}} | Total: R{{data.totalWithBonus}}"

2. **Send WhatsApp to Courier:**
   - **To:** `{{data.courierPhone}}`
   - **Message:** "📊 Today: {{data.totalDeliveries}} deliveries | Earned: R{{data.totalWithBonus}} | Rating: {{data.averageRating}}⭐"

3. **Log to Google Sheets:**
   - Spreadsheet: "Mzansi Couriers - Courier Earnings"
   - Columns: Courier Name, Date, Deliveries, Earnings, Bonus, Total, Rating

4. Click **"Publish"**

---

### **Zap 5: Support Ticket Created → Escalation**

**Trigger Setup:**
1. Use your "Support Ticket Created" webhook URL
2. Click **"Continue"**

**Actions:**
1. **Send Email to Support Team:**
   - **To:** support@mzansicouriers.co.za
   - **Subject:** "[{{data.priority}}] Support Ticket #{{data.ticketId}}: {{data.subject}}"
   - **Body:** "Customer: {{data.customerEmail}} | Category: {{data.category}} | Description: {{data.description}}"

2. **Send Slack Alert:**
   - **Channel:** #support
   - **Message:** "🆘 {{data.priority}} ticket from {{data.customerEmail}}: {{data.subject}}"

3. **Log to Google Sheets:**
   - Spreadsheet: "Mzansi Couriers - Support Tickets"
   - Columns: Ticket ID, Customer, Subject, Priority, Category, Created

4. Click **"Publish"**

---

### **Zap 6: Weekly Payout Report → Email + Google Sheets**

**Trigger Setup:**
1. Use your "Weekly Payout Report" webhook URL
2. Click **"Continue"**

**Actions:**
1. **Send Email to Finance Team:**
   - **To:** finance@mzansicouriers.co.za
   - **Subject:** "Weekly Payout Report - {{data.week}}"
   - **Body:** "Total Couriers: {{data.totalCouriers}} | Total Payouts: {{data.totalPayouts}} | Total Amount: R{{data.totalAmount}} | Date: {{data.payoutDate}}"

2. **Log to Google Sheets:**
   - Spreadsheet: "Mzansi Couriers - Weekly Payouts"
   - Columns: Week, Total Couriers, Total Payouts, Total Amount, Payout Date, Method

3. **Send Slack Alert:**
   - **Channel:** #finance
   - **Message:** "💰 Weekly payout processed: {{data.totalCouriers}} couriers | R{{data.totalAmount}} total"

4. Click **"Publish"**

---

## **Step 3: Add Webhook URLs to Your App**

Once you have all 6 webhook URLs, provide them to me in this format:

```
ZAPIER_PAYMENT_SUCCESS_URL=https://hooks.zapier.com/hooks/catch/123456/abc123xyz/
ZAPIER_DELIVERY_STATUS_URL=https://hooks.zapier.com/hooks/catch/123456/def456uvw/
ZAPIER_COURIER_ASSIGNED_URL=https://hooks.zapier.com/hooks/catch/123456/ghi789rst/
ZAPIER_EARNINGS_SUMMARY_URL=https://hooks.zapier.com/hooks/catch/123456/jkl012mno/
ZAPIER_SUPPORT_TICKET_URL=https://hooks.zapier.com/hooks/catch/123456/pqr345stu/
ZAPIER_PAYOUT_REPORT_URL=https://hooks.zapier.com/hooks/catch/123456/vwx678yza/
```

I'll add these to your app's environment variables.

---

## **Step 4: Test the Integration**

1. In each Zap, click **"Test"** to send a test webhook
2. Your app will receive the test data
3. Zapier will confirm the connection works
4. All actions (WhatsApp, Email, Google Sheets) will execute

---

## **Summary**

You now have:
- ✅ 6 Zapier Zaps created
- ✅ 6 Webhook URLs generated
- ✅ Actions configured (WhatsApp, Email, Google Sheets, Slack)
- ✅ Ready to integrate with Mzansi Couriers

**Next:** Provide me with the 6 webhook URLs, and I'll integrate them into your app!
