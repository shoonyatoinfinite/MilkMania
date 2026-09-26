import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';

let prisma: PrismaClient | null = null;
if (!USE_MOCK_DB) {
  prisma = new PrismaClient();
}

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure directory exists for JSON DB
if (USE_MOCK_DB && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Help helper to load JSON files
function readJSONFile<T>(filename: string, defaultData: T[] = []): T[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T[];
  } catch (e) {
    console.error(`Error reading database file ${filename}`, e);
    return defaultData;
  }
}

// Help helper to write JSON files
function writeJSONFile<T>(filename: string, data: T[]): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Mock Database Interface
class JSONCollection<T extends { id: string; createdAt?: Date | string; updatedAt?: Date | string }> {
  private filename: string;
  private defaultVal: T[];

  constructor(filename: string, defaultVal: T[] = []) {
    this.filename = filename;
    this.defaultVal = defaultVal;
  }

  getAll(): T[] {
    return readJSONFile<T>(this.filename, this.defaultVal);
  }

  saveAll(data: T[]): void {
    writeJSONFile<T>(this.filename, data);
  }

  findMany(filter?: (item: T) => boolean): T[] {
    const list = this.getAll();
    return filter ? list.filter(filter) : list;
  }

  findUnique(where: Partial<T>): T | null {
    const list = this.getAll();
    const item = list.find((x) => {
      return Object.entries(where).every(([key, val]) => (x as any)[key] === val);
    });
    return item || null;
  }

  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T {
    const list = this.getAll();
    const now = new Date().toISOString();
    const newItem = {
      ...data,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    } as unknown as T;
    list.push(newItem);
    this.saveAll(list);
    return newItem;
  }

  update(where: Partial<T>, data: Partial<T>): T | null {
    const list = this.getAll();
    const index = list.findIndex((x) => {
      return Object.entries(where).every(([key, val]) => (x as any)[key] === val);
    });
    if (index === -1) return null;
    const now = new Date().toISOString();
    const updatedItem = {
      ...list[index],
      ...data,
      updatedAt: now,
    };
    list[index] = updatedItem;
    this.saveAll(list);
    return updatedItem;
  }

  delete(where: Partial<T>): T | null {
    const list = this.getAll();
    const index = list.findIndex((x) => {
      return Object.entries(where).every(([key, val]) => (x as any)[key] === val);
    });
    if (index === -1) return null;
    const removed = list.splice(index, 1);
    this.saveAll(list);
    return removed[0];
  }
}

// Define JSON Collections
const jsonUsers = new JSONCollection<any>('users.json');
const jsonAnimals = new JSONCollection<any>('animals.json');
const jsonProductions = new JSONCollection<any>('productions.json');
const jsonCustomers = new JSONCollection<any>('customers.json');
const jsonSales = new JSONCollection<any>('sales.json');
const jsonPayments = new JSONCollection<any>('payments.json');
const jsonExpenses = new JSONCollection<any>('expenses.json');
const jsonInventory = new JSONCollection<any>('inventory.json');
const jsonSettings = new JSONCollection<any>('settings.json');
const jsonAdjustments = new JSONCollection<any>('adjustments.json');
const jsonMilkBought = new JSONCollection<any>('milk_bought.json');

// Unified DB Adapter
export const db = {
  isMock: USE_MOCK_DB,

  users: {
    findMany: async () => {
      if (USE_MOCK_DB) return jsonUsers.getAll();
      return prisma!.user.findMany();
    },
    findUnique: async (args: { where: { id?: string; username?: string } }) => {
      if (USE_MOCK_DB) return jsonUsers.findUnique(args.where);
      return prisma!.user.findUnique({ where: args.where as any });
    },
    create: async (args: { data: { username: string; name: string; passwordHash: string; masterPasswordHash: string; lastPasswordHash?: string | null; role?: string } }) => {
      if (USE_MOCK_DB) return jsonUsers.create(args.data);
      return prisma!.user.create({ data: args.data });
    },
    update: async (args: { where: { id: string }; data: { username?: string; name?: string; passwordHash?: string; masterPasswordHash?: string; lastPasswordHash?: string | null } }) => {
      if (USE_MOCK_DB) return jsonUsers.update(args.where, args.data);
      return prisma!.user.update({ where: args.where, data: args.data });
    },
    delete: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) return jsonUsers.delete(args.where);
      return prisma!.user.delete({ where: args.where });
    }
  },

  animals: {
    findMany: async () => {
      if (USE_MOCK_DB) return jsonAnimals.getAll();
      return prisma!.animal.findMany({ orderBy: { createdAt: 'desc' } });
    },
    findUnique: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) return jsonAnimals.findUnique(args.where);
      return prisma!.animal.findUnique({ where: args.where });
    },
    create: async (args: { data: { name: string; breed: string; age: number; purchaseDate: Date | string; status: string; photoUrl?: string; healthNotes?: string; vaccinationNotes?: string; dailyCapacity: number } }) => {
      const dataToSave = { ...args.data, purchaseDate: new Date(args.data.purchaseDate) };
      if (USE_MOCK_DB) return jsonAnimals.create(args.data);
      return prisma!.animal.create({ data: dataToSave });
    },
    update: async (args: { where: { id: string }; data: { name?: string; breed?: string; age?: number; purchaseDate?: Date | string; status?: string; photoUrl?: string; healthNotes?: string; vaccinationNotes?: string; dailyCapacity?: number } }) => {
      const dataToSave = { ...args.data };
      if (args.data.purchaseDate) {
        dataToSave.purchaseDate = new Date(args.data.purchaseDate) as any;
      }
      if (USE_MOCK_DB) return jsonAnimals.update(args.where, args.data);
      return prisma!.animal.update({ where: args.where, data: dataToSave as any });
    },
    delete: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) {
        // Also cascade delete production
        const deleted = jsonAnimals.delete(args.where);
        const prods = jsonProductions.getAll();
        const filtered = prods.filter((p: any) => p.animalId !== args.where.id);
        jsonProductions.saveAll(filtered);
        return deleted;
      }
      return prisma!.animal.delete({ where: args.where });
    }
  },

  productions: {
    findMany: async (args?: { where?: { animalId?: string; date?: { gte?: Date | string; lte?: Date | string } } }) => {
      if (USE_MOCK_DB) {
        return jsonProductions.findMany((item: any) => {
          if (args?.where?.animalId && item.animalId !== args.where.animalId) return false;
          if (args?.where?.date) {
            const itemDate = new Date(item.date).getTime();
            if (args.where.date.gte && itemDate < new Date(args.where.date.gte).getTime()) return false;
            if (args.where.date.lte && itemDate > new Date(args.where.date.lte).getTime()) return false;
          }
          return true;
        });
      }
      return prisma!.milkProduction.findMany({
        where: args?.where as any,
        include: { animal: true },
        orderBy: { date: 'desc' }
      });
    },
    create: async (args: { data: { animalId: string; date: Date | string; shift: string; quantity: number; homeConsumption?: number; notes?: string } }) => {
      const dataToSave = { ...args.data, date: new Date(args.data.date), homeConsumption: args.data.homeConsumption || 0 };
      if (USE_MOCK_DB) {
        const prod = jsonProductions.create(args.data);
        const animal = jsonAnimals.findUnique({ id: args.data.animalId });
        return { ...prod, animal };
      }
      return prisma!.milkProduction.create({
        data: dataToSave,
        include: { animal: true }
      });
    },
    update: async (args: { where: { id: string }; data: { animalId?: string; date?: Date | string; shift?: string; quantity?: number; homeConsumption?: number; notes?: string } }) => {
      const dataToSave = { ...args.data };
      if (args.data.date) {
        dataToSave.date = new Date(args.data.date) as any;
      }
      if (USE_MOCK_DB) {
        const prod = jsonProductions.update(args.where, args.data);
        if (!prod) return null;
        const animal = jsonAnimals.findUnique({ id: prod.animalId });
        return { ...prod, animal };
      }
      return prisma!.milkProduction.update({
        where: args.where,
        data: dataToSave as any,
        include: { animal: true }
      });
    },
    delete: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) return jsonProductions.delete(args.where);
      return prisma!.milkProduction.delete({ where: args.where });
    }
  },

  customers: {
    findMany: async () => {
      if (USE_MOCK_DB) return jsonCustomers.getAll();
      return prisma!.customer.findMany({ orderBy: { name: 'asc' } });
    },
    findUnique: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) return jsonCustomers.findUnique(args.where);
      return prisma!.customer.findUnique({ where: args.where });
    },
    findFirst: async (args: { where: { phone?: string; id?: string; status?: string } }) => {
      if (USE_MOCK_DB) {
        return jsonCustomers.findMany((c: any) => {
          if (args.where.phone && c.phone !== args.where.phone) return false;
          if (args.where.status && c.status !== args.where.status) return false;
          return true;
        })[0] || null;
      }
      return prisma!.customer.findFirst({ where: args.where as any });
    },
    create: async (args: { data: { name: string; phone?: string; pin?: string; village: string; address?: string; pricePerLiter: number; customerType: string; status: string; notes?: string } }) => {
      if (USE_MOCK_DB) return jsonCustomers.create(args.data);
      return prisma!.customer.create({ data: args.data });
    },
    update: async (args: { where: { id: string }; data: { name?: string; phone?: string; pin?: string; village?: string; address?: string; pricePerLiter?: number; customerType?: string; status?: string; notes?: string } }) => {
      if (USE_MOCK_DB) return jsonCustomers.update(args.where, args.data);
      return prisma!.customer.update({ where: args.where, data: args.data });
    },
    delete: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) {
        // Cascade delete sales and payments
        const deleted = jsonCustomers.delete(args.where);
        jsonSales.saveAll(jsonSales.getAll().filter((s: any) => s.customerId !== args.where.id));
        jsonPayments.saveAll(jsonPayments.getAll().filter((p: any) => p.customerId !== args.where.id));
        return deleted;
      }
      return prisma!.customer.delete({ where: args.where });
    }
  },

  sales: {
    findMany: async (args?: { where?: { id?: string; customerId?: string; date?: { gte?: Date | string; lte?: Date | string } } }) => {
      if (USE_MOCK_DB) {
        return jsonSales.findMany((item: any) => {
          if (args?.where?.id && item.id !== args.where.id) return false;
          if (args?.where?.customerId && item.customerId !== args.where.customerId) return false;
          if (args?.where?.date) {
            const itemDate = new Date(item.date).getTime();
            if (args.where.date.gte && itemDate < new Date(args.where.date.gte).getTime()) return false;
            if (args.where.date.lte && itemDate > new Date(args.where.date.lte).getTime()) return false;
          }
          return true;
        });
      }
      return prisma!.milkSales.findMany({
        where: args?.where as any,
        include: { customer: true },
        orderBy: { date: 'desc' }
      });
    },
    create: async (args: { data: { customerId: string; date: Date | string; shift: string; quantity: number; rate: number; amount: number; paymentMethod: string; remarks?: string } }) => {
      const dataToSave = { ...args.data, date: new Date(args.data.date) };
      if (USE_MOCK_DB) {
        const sale = jsonSales.create(args.data);
        const customer = jsonCustomers.findUnique({ id: args.data.customerId });
        return { ...sale, customer };
      }
      return prisma!.milkSales.create({
        data: dataToSave,
        include: { customer: true }
      });
    },
    update: async (args: { where: { id: string }; data: { customerId?: string; date?: Date | string; shift?: string; quantity?: number; rate?: number; amount?: number; paymentMethod?: string; remarks?: string } }) => {
      const dataToSave = { ...args.data };
      if (args.data.date) {
        dataToSave.date = new Date(args.data.date) as any;
      }
      if (USE_MOCK_DB) {
        const sale = jsonSales.update(args.where, args.data);
        if (!sale) return null;
        const customer = jsonCustomers.findUnique({ id: sale.customerId });
        return { ...sale, customer };
      }
      return prisma!.milkSales.update({
        where: args.where,
        data: dataToSave as any,
        include: { customer: true }
      });
    },
    delete: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) return jsonSales.delete(args.where);
      return prisma!.milkSales.delete({ where: args.where });
    }
  },

  payments: {
    findMany: async (args?: { where?: { customerId?: string; date?: { gte?: Date | string; lte?: Date | string } } }) => {
      if (USE_MOCK_DB) {
        return jsonPayments.findMany((item: any) => {
          if (args?.where?.customerId && item.customerId !== args.where.customerId) return false;
          if (args?.where?.date) {
            const itemDate = new Date(item.date).getTime();
            if (args.where.date.gte && itemDate < new Date(args.where.date.gte).getTime()) return false;
            if (args.where.date.lte && itemDate > new Date(args.where.date.lte).getTime()) return false;
          }
          return true;
        });
      }
      return prisma!.payment.findMany({
        where: args?.where as any,
        include: { customer: true },
        orderBy: { date: 'desc' }
      });
    },
    create: async (args: { data: { customerId: string; date: Date | string; amount: number; paymentMethod: string; remarks?: string } }) => {
      const dataToSave = { ...args.data, date: new Date(args.data.date) };
      if (USE_MOCK_DB) {
        const payment = jsonPayments.create(args.data);
        const customer = jsonCustomers.findUnique({ id: args.data.customerId });
        return { ...payment, customer };
      }
      return prisma!.payment.create({
        data: dataToSave,
        include: { customer: true }
      });
    },
    update: async (args: { where: { id: string }; data: { customerId?: string; date?: Date | string; amount?: number; paymentMethod?: string; remarks?: string } }) => {
      const dataToSave = { ...args.data };
      if (args.data.date) {
        dataToSave.date = new Date(args.data.date) as any;
      }
      if (USE_MOCK_DB) {
        const payment = jsonPayments.update(args.where, args.data);
        if (!payment) return null;
        const customer = jsonCustomers.findUnique({ id: payment.customerId });
        return { ...payment, customer };
      }
      return prisma!.payment.update({
        where: args.where,
        data: dataToSave as any,
        include: { customer: true }
      });
    },
    delete: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) return jsonPayments.delete(args.where);
      return prisma!.payment.delete({ where: args.where });
    }
  },

  expenses: {
    findMany: async (args?: { where?: { date?: { gte?: Date | string; lte?: Date | string }; animalId?: string; category?: string } }) => {
      if (USE_MOCK_DB) {
        return jsonExpenses.findMany((item: any) => {
          if (args?.where?.animalId && item.animalId !== args.where.animalId) return false;
          if (args?.where?.category && item.category !== args.where.category) return false;
          if (args?.where?.date) {
            const itemDate = new Date(item.date).getTime();
            if (args.where.date.gte && itemDate < new Date(args.where.date.gte).getTime()) return false;
            if (args.where.date.lte && itemDate > new Date(args.where.date.lte).getTime()) return false;
          }
          return true;
        });
      }
      return prisma!.expense.findMany({
        where: args?.where as any,
        orderBy: { date: 'desc' }
      });
    },
    create: async (args: { data: { date: Date | string; category: string; amount: number; description?: string; animalId?: string } }) => {
      const dataToSave = { ...args.data, date: new Date(args.data.date) };
      if (USE_MOCK_DB) return jsonExpenses.create(args.data);
      return prisma!.expense.create({ data: dataToSave });
    },
    update: async (args: { where: { id: string }; data: { date?: Date | string; category?: string; amount?: number; description?: string; animalId?: string } }) => {
      const dataToSave = { ...args.data };
      if (args.data.date) {
        dataToSave.date = new Date(args.data.date) as any;
      }
      if (USE_MOCK_DB) return jsonExpenses.update(args.where, args.data);
      return prisma!.expense.update({ where: args.where, data: dataToSave as any });
    },
    delete: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) return jsonExpenses.delete(args.where);
      return prisma!.expense.delete({ where: args.where });
    }
  },

  inventory: {
    findMany: async () => {
      if (USE_MOCK_DB) return jsonInventory.getAll();
      return prisma!.inventory.findMany({ orderBy: { itemName: 'asc' } });
    },
    create: async (args: { data: { itemName: string; quantity: number; unit: string; minStockAlert?: number; notes?: string } }) => {
      if (USE_MOCK_DB) return jsonInventory.create(args.data);
      return prisma!.inventory.create({ data: args.data });
    },
    update: async (args: { where: { id: string }; data: { itemName?: string; quantity?: number; unit?: string; minStockAlert?: number; notes?: string } }) => {
      if (USE_MOCK_DB) return jsonInventory.update(args.where, args.data);
      return prisma!.inventory.update({ where: args.where, data: args.data });
    },
    delete: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) return jsonInventory.delete(args.where);
      return prisma!.inventory.delete({ where: args.where });
    }
  },

  settings: {
    findMany: async () => {
      if (USE_MOCK_DB) return jsonSettings.getAll();
      return prisma!.setting.findMany();
    },
    findUnique: async (args: { where: { key: string } }) => {
      if (USE_MOCK_DB) return jsonSettings.findUnique(args.where);
      return prisma!.setting.findUnique({ where: args.where });
    },
    create: async (args: { data: { key: string; value: string; description?: string } }) => {
      if (USE_MOCK_DB) return jsonSettings.create(args.data);
      return prisma!.setting.create({ data: args.data });
    },
    update: async (args: { where: { key: string }; data: { value: string; description?: string } }) => {
      if (USE_MOCK_DB) return jsonSettings.update(args.where, args.data);
      return prisma!.setting.update({ where: args.where, data: args.data });
    }
  },

  sessionAdjustments: {
    findMany: async (args?: { where?: any }) => {
      if (USE_MOCK_DB) return jsonAdjustments.findMany(args?.where);
      return prisma!.sessionAdjustment.findMany({
        where: args?.where,
        orderBy: { date: 'asc' }
      });
    },
    create: async (args: { data: { date: Date | string; shift: string; actionType: string; quantity: number } }) => {
      const dataToSave = { ...args.data, date: new Date(args.data.date) };
      if (USE_MOCK_DB) return jsonAdjustments.create(args.data);
      return prisma!.sessionAdjustment.create({ data: dataToSave });
    },
    delete: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) return jsonAdjustments.delete(args.where);
      return prisma!.sessionAdjustment.delete({ where: args.where });
    }
  },

  milkBought: {
    findMany: async (args?: { where?: { date?: { gte?: Date | string; lte?: Date | string }; shift?: string } }) => {
      if (USE_MOCK_DB) {
        return jsonMilkBought.findMany((item: any) => {
          if (args?.where?.shift && item.shift !== args.where.shift) return false;
          if (args?.where?.date) {
            const itemDate = new Date(item.date).getTime();
            if (args.where.date.gte && itemDate < new Date(args.where.date.gte).getTime()) return false;
            if (args.where.date.lte && itemDate > new Date(args.where.date.lte).getTime()) return false;
          }
          return true;
        });
      }
      return prisma!.milkBought.findMany({
        where: args?.where as any,
        orderBy: { date: 'desc' }
      });
    },
    findUnique: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) return jsonMilkBought.findUnique(args.where);
      return prisma!.milkBought.findUnique({ where: args.where });
    },
    create: async (args: { data: { supplierName: string; date: Date | string; shift?: string; quantity: number; rate: number; amount: number; fat?: number; snf?: number; paymentMethod?: string; notes?: string } }) => {
      const dataToSave = { ...args.data, date: new Date(args.data.date) };
      if (USE_MOCK_DB) return jsonMilkBought.create(args.data);
      return prisma!.milkBought.create({ data: dataToSave });
    },
    update: async (args: { where: { id: string }; data: { supplierName?: string; date?: Date | string; shift?: string; quantity?: number; rate?: number; amount?: number; fat?: number; snf?: number; paymentMethod?: string; notes?: string } }) => {
      const dataToSave = { ...args.data };
      if (args.data.date) {
        dataToSave.date = new Date(args.data.date) as any;
      }
      if (USE_MOCK_DB) return jsonMilkBought.update(args.where, args.data);
      return prisma!.milkBought.update({ where: args.where, data: dataToSave as any });
    },
    delete: async (args: { where: { id: string } }) => {
      if (USE_MOCK_DB) return jsonMilkBought.delete(args.where);
      return prisma!.milkBought.delete({ where: args.where });
    }
  }
};
