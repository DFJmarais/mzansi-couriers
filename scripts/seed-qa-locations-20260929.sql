-- Synthetic QA location supplement for QA_SEED_20260929.
-- Updates only the synthetic courier namespace; no real courier records are changed.
START TRANSACTION;
UPDATE courier_profiles cp
JOIN users u ON u.id = cp.userId
SET cp.province = CASE MOD(cp.userId, 9)
  WHEN 0 THEN 'Eastern Cape'
  WHEN 1 THEN 'Free State'
  WHEN 2 THEN 'Gauteng'
  WHEN 3 THEN 'KwaZulu-Natal'
  WHEN 4 THEN 'Limpopo'
  WHEN 5 THEN 'Mpumalanga'
  WHEN 6 THEN 'Northern Cape'
  WHEN 7 THEN 'North West'
  ELSE 'Western Cape'
END,
cp.region = CASE MOD(cp.userId, 9)
  WHEN 0 THEN 'Gqeberha'
  WHEN 1 THEN 'Bloemfontein'
  WHEN 2 THEN 'Johannesburg South'
  WHEN 3 THEN 'Durban North'
  WHEN 4 THEN 'Polokwane'
  WHEN 5 THEN 'Mbombela'
  WHEN 6 THEN 'Kimberley'
  WHEN 7 THEN 'Rustenburg'
  ELSE 'Cape Town CBD'
END
WHERE u.openId LIKE 'qa-seed-20260929-courier-%';

UPDATE courier_onboarding co
JOIN users u ON u.id = co.userId
SET co.province = CASE MOD(co.userId, 9)
  WHEN 0 THEN 'Eastern Cape'
  WHEN 1 THEN 'Free State'
  WHEN 2 THEN 'Gauteng'
  WHEN 3 THEN 'KwaZulu-Natal'
  WHEN 4 THEN 'Limpopo'
  WHEN 5 THEN 'Mpumalanga'
  WHEN 6 THEN 'Northern Cape'
  WHEN 7 THEN 'North West'
  ELSE 'Western Cape'
END,
co.region = CASE MOD(co.userId, 9)
  WHEN 0 THEN 'Gqeberha'
  WHEN 1 THEN 'Bloemfontein'
  WHEN 2 THEN 'Johannesburg South'
  WHEN 3 THEN 'Durban North'
  WHEN 4 THEN 'Polokwane'
  WHEN 5 THEN 'Mbombela'
  WHEN 6 THEN 'Kimberley'
  WHEN 7 THEN 'Rustenburg'
  ELSE 'Cape Town CBD'
END
WHERE u.openId LIKE 'qa-seed-20260929-courier-%';
COMMIT;
