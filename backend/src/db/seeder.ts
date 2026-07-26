import bcrypt from 'bcryptjs';
import { db } from './db';

export async function seedDatabase() {
  try {
    const users = await db.users.findMany();
    if (users.length > 0) {
      console.log('Database already seeded. Skipping auto-seeding.');
      return;
    }

    console.log('Seeding initial database...');

    // 1. Seed exactly one master admin user from environment variables
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
    const adminMasterPassword = process.env.INITIAL_ADMIN_MASTER_PASSWORD;

    if (!adminEmail || !adminPassword || !adminMasterPassword) {
      throw new Error(
        'Database seeding failed: Missing INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, or INITIAL_ADMIN_MASTER_PASSWORD in environment variables.'
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    const masterPasswordHash = await bcrypt.hash(adminMasterPassword, salt);

    await db.users.create({
      data: {
        username: adminEmail,
        name: 'Master Admin',
        passwordHash,
        masterPasswordHash,
        lastPasswordHash: null,
        role: 'ADMIN',
      },
    });

    console.log(`Seeded master admin user from env configuration: ${adminEmail}`);

    // 2. Seed default farm settings
    await db.settings.create({
      data: {
        key: 'default_milk_rate',
        value: '65',
        description: 'Default price per liter of milk for individual customers',
      },
    });

    await db.settings.create({
      data: {
        key: 'default_bulk_rate',
        value: '58',
        description: 'Default price per liter of milk for bulk milk collectors',
      },
    });

    await db.settings.create({
      data: {
        key: 'farm_name',
        value: 'Milk Mania Farm',
        description: 'Name of the farm shown on ledgers and bills',
      },
    });

    console.log('Seeded base farm settings.');
    console.log('Seeding process completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
