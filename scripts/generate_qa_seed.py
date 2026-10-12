from pathlib import Path

MARKER = "QA_SEED_20260929"
OUT = Path(__file__).with_name("seed-qa-dataset-20260929.sql")

def sql(value):
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    return "'" + str(value).replace("'", "''") + "'"

def json_array(values):
    return "JSON_ARRAY(" + ",".join(sql(value) for value in values) + ")" if values else "JSON_ARRAY()"

def user_id(kind: str, number: int) -> str:
    return f"qa-seed-20260929-{kind}-{number:02d}"

def user_ref(open_id: str) -> str:
    return f"(SELECT id FROM users WHERE openId={sql(open_id)} LIMIT 1)"

def address_ref(open_id: str, label: str) -> str:
    return f"(SELECT id FROM addresses WHERE userId={user_ref(open_id)} AND label={sql(label)} LIMIT 1)"

def delivery_ref(tracking: str) -> str:
    return f"(SELECT id FROM deliveries WHERE trackingCode={sql(tracking)} LIMIT 1)"

def lines():
    result = [
        f"-- Synthetic QA dataset for Mzansi Couriers. Marker: {MARKER}",
        "-- All names, emails, phones, addresses, URLs, and tracking codes below are synthetic.",
        "-- This file is intentionally append-only and uses a unique QA namespace.",
        "",
    ]

    users = []
    for i in range(1, 21):
        users.append((user_id("customer", i), f"QA Customer {i:02d}", f"qa.customer{i:02d}@example.invalid", f"+2782000{i:05d}", "customer"))
    for i in range(1, 11):
        users.append((user_id("courier", i), f"QA Courier {i:02d}", f"qa.courier{i:02d}@example.invalid", f"+2783000{i:05d}", "courier"))
    values = ",\n".join(
        f"({sql(open_id)},{sql(name)},{sql(email)},{sql(phone)},'qa-seed',{sql(role)},true)"
        for open_id, name, email, phone, role in users
    )
    result.append("INSERT INTO users (openId,name,email,phone,loginMethod,role,isVerified) VALUES\n" + values + ";")
    result.append("")

    for i in range(1, 21):
        customer = user_id("customer", i)
        pickup_lat = -26.10 + (i % 5) * 0.035
        pickup_lng = 28.00 + (i % 6) * 0.045
        result.append(
            f"INSERT INTO addresses (userId,label,street,city,postalCode,latitude,longitude,isDefault) "
            f"SELECT {user_ref(customer)},'QA Pickup',{sql(f'QA Pickup Street {i}')},'Johannesburg','2000',{sql(f'{pickup_lat:.8f}')},{sql(f'{pickup_lng:.8f}')},true;"
        )
        result.append(
            f"INSERT INTO addresses (userId,label,street,city,postalCode,latitude,longitude,isDefault) "
            f"SELECT {user_ref(customer)},'QA Drop-off',{sql(f'QA Drop-off Avenue {i}')},'Pretoria','0001',{sql(f'{pickup_lat + 0.55:.8f}')},{sql(f'{pickup_lng + 0.35:.8f}')},false;"
        )
    result.append("")

    vehicles = ["car", "motorbike", "van", "bakkie", "car", "motorbike", "van", "bakkie", "car", "van"]
    provinces = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape", "Eastern Cape"]
    regions = ["Gqeberha", "Bloemfontein", "Johannesburg South", "Durban North", "Polokwane", "Mbombela", "Kimberley", "Rustenburg", "Cape Town CBD", "East London"]
    for i, vehicle in enumerate(vehicles, 1):
        courier = user_id("courier", i)
        result.append(
            f"INSERT INTO courier_profiles (userId,vehicleType,vehicleRegistration,licenseNumber,province,region,isAvailable,rating,totalDeliveries,totalEarnings) "
            f"SELECT {user_ref(courier)},{sql(vehicle)},{sql(f'QA-{i:03d}')},{sql(f'QA-LIC-{i:03d}')},{sql(provinces[i - 1])},{sql(regions[i - 1])},{sql(i <= 8)},{sql(f'{4.45 + (i % 5) * 0.1:.2f}')},{8 + i},{sql(f'{1200 + i * 137:.2f}')};"
        )
    for name, area, address, lat, lng in [
        ("QA Randburg Handoff Hub", "Randburg", "QA Main Road, Randburg", -26.094, 28.001),
        ("QA Midrand Handoff Hub", "Midrand", "QA Old Pretoria Road, Midrand", -25.989, 28.128),
        ("QA Pretoria Handoff Hub", "Pretoria", "QA Church Street, Pretoria", -25.747, 28.229),
    ]:
        result.append(
            f"INSERT INTO relay_handoff_points (name,area,address,latitude,longitude,safetyNotes,isActive) VALUES "
            f"({sql(name)},{sql(area)},{sql(address)},{sql(f'{lat:.7f}')},{sql(f'{lng:.7f}')},{sql('Synthetic QA public meeting point; verify the live safety checklist.')},true);"
        )
    result.append("")

    for j in range(1, 101):
        customer = user_id("customer", ((j - 1) % 20) + 1)
        status = "delivered" if j <= 45 else "in-transit" if j <= 75 else "assigned" if j <= 90 else "pending"
        courier = None if status == "pending" else user_id("courier", ((j - 1) % 10) + 1)
        size = ["small", "medium", "large"][(j - 1) % 3]
        package_type = ["envelope", "box", "soft_parcel"][(j - 1) % 3]
        length = 22 + (j % 5) * 4
        width = 16 + (j % 4) * 3
        height = 8 + (j % 3) * 3
        weight = 0.5 + (j % 15) * 0.75
        price = 95 + (j % 12) * 18
        fragile = j % 11 == 0
        livestock = j in (37, 88)
        pickup_lat = -26.10 + (j % 5) * 0.035
        pickup_lng = 28.00 + (j % 6) * 0.045
        tracking = f"QA260929-{j:03d}"
        courier_expr = "NULL" if courier is None else user_ref(courier)
        actual_expr = "DATE_SUB(NOW(), INTERVAL %d DAY)" % (j % 14) if status == "delivered" else "NULL"
        proof_expr = "JSON_OBJECT('type','photo','data','qa-seed-proof')" if status == "delivered" else "NULL"
        result.append(
            f"INSERT INTO deliveries (customerId,recipientName,recipientEmail,recipientPhone,courierId,pickupAddressId,dropoffAddressId,"
            f"pickupLatitude,pickupLongitude,dropoffLatitude,dropoffLongitude,status,packageSize,packageType,lengthCm,widthCm,heightCm,"
            f"fragile,livestock,packageWeight,packageDescription,trackingCode,estimatedPrice,finalPrice,distance,estimatedDeliveryTime,"
            f"actualDeliveryTime,proofOfDelivery,packageLabelPhotoUrl,packageLabelPhotoKey,packageLabelConfirmedAt,notes) SELECT "
            f"{user_ref(customer)},{sql(f'QA Recipient {((j - 1) % 20) + 1:02d}')},{sql(f'qa.recipient{((j - 1) % 20) + 1:02d}@example.invalid')},"
            f"{sql(f'+2784000{j:04d}')},{courier_expr},{address_ref(customer, 'QA Pickup')},{address_ref(customer, 'QA Drop-off')},"
            f"{sql(f'{pickup_lat:.8f}')},{sql(f'{pickup_lng:.8f}')},{sql(f'{pickup_lat + 0.55:.8f}')},{sql(f'{pickup_lng + 0.35:.8f}')},"
            f"{sql(status)},{sql(size)},{sql(package_type)},{sql(f'{length:.1f}')},{sql(f'{width:.1f}')},{sql(f'{height:.1f}')},"
            f"{sql(fragile)},{sql(livestock)},{sql(f'{weight:.2f}')},{sql(f'QA synthetic parcel {j:03d}; {MARKER}')},{sql(tracking)},"
            f"{sql(f'{price:.2f}')},{sql(f'{price:.2f}')},{sql(f'{18 + (j % 9) * 7:.2f}')},{90 + (j % 6) * 30},{actual_expr},{proof_expr},"
            f"{sql(f'https://example.invalid/qa/{tracking}.jpg')},{sql(f'qa/{tracking}.jpg')},DATE_SUB(NOW(), INTERVAL 1 DAY),{sql(f'{MARKER}; flow coverage batch {j:03d}')};"
        )
    result.append("")

    result += [
        "INSERT INTO parcel_custody_scans (deliveryId,relayLegId,scannedByUserId,scanType,scannedCode,accepted,scannedAt) SELECT id,NULL,courierId,'pickup',trackingCode,true,DATE_SUB(NOW(), INTERVAL 2 HOUR) FROM deliveries WHERE trackingCode LIKE 'QA260929-%' AND courierId IS NOT NULL;",
        "INSERT INTO parcel_custody_scans (deliveryId,relayLegId,scannedByUserId,scanType,scannedCode,accepted,scannedAt) SELECT id,NULL,courierId,'delivery',trackingCode,true,DATE_SUB(NOW(), INTERVAL 1 DAY) FROM deliveries WHERE trackingCode LIKE 'QA260929-%' AND status='delivered';",
    ]

    for j in range(1, 26):
        tracking = f"QA260929-{j:03d}"
        courier_one = user_id("courier", ((j - 1) % 10) + 1)
        courier_two = user_id("courier", (j % 10) + 1)
        leg_one_status = "completed" if j <= 15 else "handed_off" if j <= 23 else "accepted"
        leg_two_status = "completed" if j <= 15 else "final_delivery" if j <= 23 else "planned"
        current = courier_two if j <= 23 else courier_one
        handoff_time = "DATE_SUB(NOW(), INTERVAL 90 MINUTE)" if j <= 23 else "NULL"
        complete_time = "DATE_SUB(NOW(), INTERVAL 90 MINUTE)" if j <= 15 else "NULL"
        result.append(
            f"INSERT INTO delivery_relay_legs (deliveryId,sequence,originArea,destinationArea,handoffPointId,handoffMode,meetingAddress,meetingLatitude,meetingLongitude,"
            f"fromCourierId,toCourierId,status,currentCustodianId,acceptedAt,pickupAt,handedOffAt,completedAt,courierNote) SELECT {delivery_ref(tracking)},1,"
            f"'Johannesburg','Midrand',(SELECT id FROM relay_handoff_points WHERE name='QA Midrand Handoff Hub' LIMIT 1),'designated_point','QA Old Pretoria Road, Midrand',"
            f"'-25.9890000','28.1280000',NULL,{user_ref(courier_one)},{sql(leg_one_status)},{user_ref(current)},DATE_SUB(NOW(), INTERVAL 3 HOUR),"
            f"DATE_SUB(NOW(), INTERVAL 2 HOUR),{handoff_time},{complete_time},{sql(f'QA relay leg 1; {MARKER}')};"
        )
        result.append(
            f"INSERT INTO delivery_relay_legs (deliveryId,sequence,originArea,destinationArea,handoffPointId,handoffMode,meetingAddress,meetingLatitude,meetingLongitude,"
            f"fromCourierId,toCourierId,status,currentCustodianId,acceptedAt,pickupAt,handedOffAt,completedAt,courierNote) SELECT {delivery_ref(tracking)},2,"
            f"'Midrand','Pretoria',(SELECT id FROM relay_handoff_points WHERE name='QA Pretoria Handoff Hub' LIMIT 1),'designated_point','QA Church Street, Pretoria',"
            f"'-25.7470000','28.2290000',{user_ref(courier_one)},{user_ref(courier_two)},{sql(leg_two_status)},{user_ref(current)},DATE_SUB(NOW(), INTERVAL 90 MINUTE),"
            f"DATE_SUB(NOW(), INTERVAL 80 MINUTE),{handoff_time},{'DATE_SUB(NOW(), INTERVAL 1 DAY)' if j <= 15 else 'NULL'},{sql(f'QA relay leg 2; {MARKER}')};"
        )
        result.append(
            f"INSERT INTO parcel_custody_scans (deliveryId,relayLegId,scannedByUserId,scanType,scannedCode,accepted,scannedAt) SELECT d.id,l.id,l.toCourierId,'relay_receive',"
            f"d.trackingCode,{sql(j not in (20, 21))},DATE_SUB(NOW(), INTERVAL 70 MINUTE) FROM deliveries d JOIN delivery_relay_legs l ON l.deliveryId=d.id AND l.sequence=2 "
            f"WHERE d.trackingCode={sql(tracking)} LIMIT 1;"
        )
        offer_status = "accepted" if j <= 15 or j >= 23 else "offered" if j <= 19 else "declined"
        responded = "DATE_SUB(NOW(), INTERVAL 50 MINUTE)" if offer_status != "offered" else "NULL"
        result.append(
            f"INSERT INTO courier_handoff_offers (relayLegId,offeredByCourierId,offeredToCourierId,status,reason,expiresAt,respondedAt) SELECT l.id,{user_ref(courier_one)},"
            f"{user_ref(courier_two)},{sql(offer_status)},{sql(f'QA relay handoff test; {MARKER}')},DATE_ADD(NOW(), INTERVAL 18 HOUR),{responded} "
            f"FROM delivery_relay_legs l JOIN deliveries d ON d.id=l.deliveryId WHERE d.trackingCode={sql(tracking)} AND l.sequence=2 LIMIT 1;"
        )
        defect = j in (19, 20, 21)
        result.append(
            f"INSERT INTO relay_handoff_inspections (deliveryId,relayLegId,inspectorCourierId,conditionAccepted,checklist,defectNote,defectPhotoUrls) SELECT d.id,l.id,"
            f"{user_ref(courier_two)},{sql(not defect)},JSON_OBJECT('outerPackagingIntact',{sql(not defect)},'labelReadable',true,'sealIntact',{sql(not defect)},'contentsStable',{sql(not defect)}),"
            f"{sql('QA defect path: packaging review required' if defect else '')},{json_array([f'https://example.invalid/qa/defect-{j:03d}.jpg'] if defect else [])} "
            f"FROM deliveries d JOIN delivery_relay_legs l ON l.deliveryId=d.id AND l.sequence=2 WHERE d.trackingCode={sql(tracking)} LIMIT 1;"
        )
    result.append("")

    result += [
        "INSERT INTO delivery_tracking (deliveryId,courierId,latitude,longitude,accuracy,speed,heading,timestamp) SELECT id,courierId,pickupLatitude,pickupLongitude,12.0,34.0,90.0,DATE_SUB(NOW(), INTERVAL 15 MINUTE) FROM deliveries WHERE trackingCode LIKE 'QA260929-%' AND courierId IS NOT NULL AND status IN ('in-transit','assigned');",
        "INSERT INTO delivery_reviews (deliveryId,reviewerUserId,score,comment) SELECT id,customerId,CASE MOD(id,3) WHEN 0 THEN 5 WHEN 1 THEN 4 ELSE 3 END,'QA synthetic review for delivery flow coverage' FROM deliveries WHERE trackingCode LIKE 'QA260929-%' AND status='delivered';",
        "INSERT INTO notifications (userId,type,title,message,relatedDeliveryId,isRead) SELECT customerId,'delivery_status','QA parcel update',CONCAT('Synthetic QA update for ',trackingCode),id,false FROM deliveries WHERE trackingCode LIKE 'QA260929-%';",
        "INSERT INTO notifications (userId,type,title,message,relatedDeliveryId,isRead) SELECT courierId,'delivery_assigned','QA route assignment',CONCAT('Synthetic QA parcel ',trackingCode,' is on your route.'),id,false FROM deliveries WHERE trackingCode LIKE 'QA260929-%' AND courierId IS NOT NULL;",
        f"INSERT INTO dispatch_runs (status,requestedBy,parcelCount,assignedCount,unassignedCount,aiSummary) SELECT 'committed',id,100,90,10,{sql('QA_SEED_20260929 dispatch run: 90 courier assignments, 10 pending customer parcels.')} FROM users WHERE role='admin' ORDER BY id LIMIT 1;",
        "SET @qa_dispatch_id = LAST_INSERT_ID();",
        "INSERT INTO dispatch_assignments (dispatchRunId,deliveryId,courierId,sequence,score,distanceToPickupKm,areaMatch,reasoning,status) SELECT @qa_dispatch_id,id,courierId,ROW_NUMBER() OVER (PARTITION BY courierId ORDER BY id),80 + MOD(id,20),4.5 + MOD(id,7),'Johannesburg–Pretoria QA corridor','QA synthetic SmartStack assignment; route fit and courier capacity reviewed.','assigned' FROM deliveries WHERE trackingCode LIKE 'QA260929-%' AND courierId IS NOT NULL;",
        f"INSERT INTO smart_match_audits (courierId,deliveryId,recommendationId,matchScore,routeCompatibilityScore,deadlineRisk,decision,routeConsidered,reason,outcomeNote) SELECT courierId,id,NULL,82 + MOD(id,16),78 + MOD(id,19),CASE WHEN status='delivered' THEN 'low' WHEN status='in-transit' THEN 'medium' ELSE 'high' END,CASE WHEN status='delivered' THEN 'completed' WHEN status='in-transit' THEN 'accepted' ELSE 'recommended' END,JSON_OBJECT('seed',{sql(MARKER)},'corridor','Johannesburg–Pretoria','capacityAware',true),{sql('QA SmartMatch audit decision; ' + MARKER)},CASE WHEN status='delivered' THEN 'QA completed outcome' ELSE NULL END FROM deliveries WHERE trackingCode LIKE 'QA260929-%' AND courierId IS NOT NULL;",
    ]

    for i in range(1, 11):
        courier = user_id("courier", i)
        run_status = "active" if i <= 6 else "planned"
        started = "DATE_SUB(NOW(), INTERVAL 2 HOUR)" if run_status == "active" else "NULL"
        result.append(f"INSERT INTO delivery_runs (courierId,status,startedAt) SELECT {user_ref(courier)},{sql(run_status)},{started};")
        result.append(
            f"INSERT INTO delivery_run_stops (runId,deliveryId,sequence,status,courierAcceptedAt,courierArrivedAt,pickupCompletedAt,courierNote) SELECT "
            f"(SELECT id FROM delivery_runs WHERE courierId={user_ref(courier)} ORDER BY id DESC LIMIT 1),d.id,ROW_NUMBER() OVER (ORDER BY d.id),"
            f"CASE WHEN d.status='delivered' THEN 'completed' WHEN d.status='in-transit' THEN 'navigating' ELSE 'queued' END,DATE_SUB(NOW(), INTERVAL 2 HOUR),"
            f"CASE WHEN d.status IN ('in-transit','delivered') THEN DATE_SUB(NOW(), INTERVAL 90 MINUTE) ELSE NULL END,"
            f"CASE WHEN d.status IN ('in-transit','delivered') THEN DATE_SUB(NOW(), INTERVAL 60 MINUTE) ELSE NULL END,{sql('QA daily route stop; ' + MARKER)} "
            f"FROM deliveries d WHERE d.trackingCode LIKE 'QA260929-%' AND d.courierId={user_ref(courier)} AND d.status IN ('in-transit','assigned','delivered');"
        )
    result.append("")

    exception_types = ["courier_delayed", "receiving_courier_delayed", "handoff_failed", "address_clarification", "recipient_unavailable", "connectivity_concern", "custody_review", "courier_delayed"]
    for offset, exception_type in enumerate(exception_types, 18):
        tracking = f"QA260929-{offset:03d}"
        resolved = offset % 2 == 0
        status = "resolved" if resolved else "open"
        action = "wait_and_retry" if exception_type in ("courier_delayed", "receiving_courier_delayed") else "safe_hold" if exception_type == "handoff_failed" else "operations_review"
        resolved_by = "(SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1)" if resolved else "NULL"
        resolution = sql("QA owner team resolved this synthetic exception.") if resolved else "NULL"
        resolved_at = "DATE_SUB(NOW(), INTERVAL 20 MINUTE)" if resolved else "NULL"
        result.append(
            f"INSERT INTO relay_exception_events (deliveryId,relayLegId,reportedByUserId,currentCustodianId,type,status,recoveryAction,reason,note,latitude,longitude,evidencePhotoUrl,customerNotifiedAt,resolvedByUserId,resolutionNote,resolvedAt) "
            f"SELECT d.id,(SELECT id FROM delivery_relay_legs WHERE deliveryId=d.id AND sequence=2 LIMIT 1),d.courierId,d.courierId,{sql(exception_type)},{sql(status)},{sql(action)},"
            f"{sql('QA synthetic exception for audit coverage: ' + exception_type)},{sql('QA recovery note; ' + MARKER)},d.dropoffLatitude,d.dropoffLongitude,"
            f"{sql(f'https://example.invalid/qa/exception-{offset:03d}.jpg')},DATE_SUB(NOW(), INTERVAL 45 MINUTE),{resolved_by},{resolution},{resolved_at} "
            f"FROM deliveries d WHERE d.trackingCode={sql(tracking)} LIMIT 1;"
        )

    result += ["", "-- End of synthetic QA dataset."]
    return result

if __name__ == "__main__":
    content = "\n".join(lines()) + "\n"
    OUT.write_text(content)
    print(f"wrote {OUT} ({content.count(chr(10))} lines)")
