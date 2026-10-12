import { drizzle } from 'drizzle-orm/mysql2/promise';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const db = drizzle(connection, { schema });

try {
  console.log('Setting up courier account for maraiswrites@gmail.com...');

  // Find the user
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, 'maraiswrites@gmail.com'),
  });

  if (!user) {
    console.error('User not found. Please sign up first at the app.');
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (ID: ${user.id})`);

  // Update user role to courier
  await db.update(schema.users)
    .set({ role: 'courier' })
    .where(eq(schema.users.id, user.id));

  console.log('✅ User role updated to courier');

  // Create courier profile
  const courierProfile = {
    userId: user.id,
    name: 'Rick Marais',
    vehicleType: 'Car',
    vehicleRegistration: 'MZ-TEST-001',
    licensePlate: 'MC001',
    serviceRadius: 120,
    serviceArea: 'Cape Town',
    status: 'active',
    averageRating: 5.0,
    totalDeliveries: 0,
    totalEarnings: 0,
    bankAccount: 'Test Bank Account',
    bankCode: '632005',
    accountNumber: '1234567890',
    accountHolder: 'Rick Marais',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Check if courier profile exists
  const existingProfile = await db.query.courierProfiles.findFirst({
    where: eq(schema.courierProfiles.userId, user.id),
  });

  if (existingProfile) {
    console.log('Courier profile already exists, updating...');
    await db.update(schema.courierProfiles)
      .set(courierProfile)
      .where(eq(schema.courierProfiles.userId, user.id));
  } else {
    console.log('Creating new courier profile...');
    await db.insert(schema.courierProfiles).values(courierProfile);
  }

  console.log('✅ Courier profile created/updated');

  // Initialize onboarding as completed
  const onboarding = {
    userId: user.id,
    currentStep: '7',
    requirementsCheckCompleted: true,
    idVerificationCompleted: true,
    vehicleVerificationCompleted: true,
    backgroundCheckCompleted: true,
    bankDetailsCompleted: true,
    trainingCompleted: true,
    onboardingCompleted: true,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const existingOnboarding = await db.query.courierOnboarding.findFirst({
    where: eq(schema.courierOnboarding.userId, user.id),
  });

  if (existingOnboarding) {
    console.log('Onboarding record already exists, updating...');
    await db.update(schema.courierOnboarding)
      .set(onboarding)
      .where(eq(schema.courierOnboarding.userId, user.id));
  } else {
    console.log('Creating onboarding record...');
    await db.insert(schema.courierOnboarding).values(onboarding);
  }

  console.log('✅ Onboarding completed');

  console.log('\n✅ COURIER ACCOUNT SETUP COMPLETE!');
  console.log('Email: maraiswrites@gmail.com');
  console.log('Role: Courier');
  console.log('Status: Active');
  console.log('Service Area: Cape Town (120km radius)');
  console.log('\nYou can now log in and access courier features!');

  process.exit(0);
} catch (error) {
  console.error('Error setting up courier account:', error);
  process.exit(1);
}
