-- Synthetic QA supplement for QA_SEED_20260929.
-- Safe to rerun only after checking the marker counts; payment references are unique.
-- These records are not real customer payments, bank details, or Paystack recipients.
START TRANSACTION;

INSERT INTO delivery_payment_sessions (customerId,reference,amount,currency,status,bookingData,deliveryId,createdAt,updatedAt,paidAt)
SELECT customerId,CONCAT('QA-PAY-260929-',trackingCode),estimatedPrice,'ZAR',CASE WHEN status='pending' THEN 'pending' ELSE 'paid' END,
JSON_OBJECT('seed','QA_SEED_20260929','trackingCode',trackingCode,'packageType',packageType,'packageSize',packageSize),id,createdAt,updatedAt,
CASE WHEN status='pending' THEN NULL ELSE DATE_SUB(NOW(), INTERVAL 1 DAY) END
FROM deliveries WHERE trackingCode LIKE 'QA260929-%'
  AND NOT EXISTS (SELECT 1 FROM delivery_payment_sessions p WHERE p.reference=CONCAT('QA-PAY-260929-',deliveries.trackingCode));

INSERT INTO smart_stack_recommendations (courierId,status,stackScore,totalDistanceKm,totalTimeMinutes,grossEarnings,platformFee,estimatedFuel,estimatedCourierNet,capacityUsedUnits,capacityUnits,deadlineRisk,emptyKilometres,routeStops,selectionReason,expiresAt)
SELECT u.id,CASE WHEN MOD(u.id,3)=0 THEN 'accepted' ELSE 'recommended' END,86 + MOD(u.id,8),74 + MOD(u.id,18),145 + MOD(u.id,35),420.00,84.00,92.50,243.50,3,6,CASE WHEN MOD(u.id,4)=0 THEN 'high' ELSE 'medium' END,6.50,
JSON_ARRAY(JSON_OBJECT('parcelId',d1.id,'kind','pickup','area','Johannesburg'),JSON_OBJECT('parcelId',d2.id,'kind','pickup','area','Midrand'),JSON_OBJECT('parcelId',d1.id,'kind','delivery','area','Pretoria')),
'QA SmartStack route recommendation: capacity, route fit, deadline, and economics checked.',DATE_ADD(NOW(), INTERVAL 12 HOUR)
FROM users u
JOIN deliveries d1 ON d1.trackingCode=CONCAT('QA260929-',LPAD((MOD(u.id,20)+1),3,'0'))
JOIN deliveries d2 ON d2.trackingCode=CONCAT('QA260929-',LPAD((MOD(u.id+5,20)+1),3,'0'))
WHERE u.openId LIKE 'qa-seed-20260929-courier-%'
  AND NOT EXISTS (SELECT 1 FROM smart_stack_recommendations r WHERE r.courierId=u.id AND r.selectionReason LIKE 'QA SmartStack route%');

INSERT INTO smart_addon_opportunities (recommendationId,courierId,deliveryId,status,additionalDistanceKm,additionalTimeMinutes,additionalPayout,deadlineRisk,score,reason,expiresAt)
SELECT NULL,u.id,d.id,'offered',7.5,24,58.00,'low',89.00,'QA optional add-on: this parcel fits the existing route with no rating penalty for declining.',DATE_ADD(NOW(), INTERVAL 12 HOUR)
FROM users u JOIN deliveries d ON d.trackingCode=CONCAT('QA260929-',LPAD((90 + MOD(u.id,10) + 1),3,'0'))
WHERE u.openId LIKE 'qa-seed-20260929-courier-%'
  AND NOT EXISTS (SELECT 1 FROM smart_addon_opportunities a WHERE a.courierId=u.id AND a.deliveryId=d.id AND a.reason LIKE 'QA optional add-on%');

INSERT INTO payout_settings (courierId,bankName,branchCode,accountName,accountNumber,accountType,paystackRecipientCode,isVerified,payoutFrequency,payoutDay,minimumPayoutAmount)
SELECT u.id,'QA Bank','000000',CONCAT('QA Courier ',LPAD(MOD(u.id,10)+1,2,'0')),CONCAT('QA-ENCRYPTED-ACCOUNT-',LPAD(MOD(u.id,10)+1,2,'0')),'savings',CONCAT('QA_RECIPIENT_260929_',LPAD(MOD(u.id,10)+1,2,'0')),true,'weekly',4,100.00
FROM users u
WHERE u.openId LIKE 'qa-seed-20260929-courier-%'
  AND NOT EXISTS (SELECT 1 FROM payout_settings ps WHERE ps.courierId=u.id);

COMMIT;
