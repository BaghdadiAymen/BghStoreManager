import { Product, CartItem, SaleRecord, BrokenRecord, DebtRecord, User } from '../types';

const INITIAL_PRODUCTS: Product[] = [
  { qr_id: '1001', name: 'iPhone 15 Pro Case Clear', category: 'Cases', buy_price: 1000, price: 1500, stock: 20, supplier: 'Apple Supplier', broken_count: 1 },
  { qr_id: '1002', name: 'USB-C Fast Charger 20W', category: 'Chargers', buy_price: 1500, price: 2500, stock: 15, supplier: 'Anker Supplier', broken_count: 2 },
  { qr_id: '1003', name: 'Samsung S24 Glass Protector', category: 'Protectors', buy_price: 500, price: 1000, stock: 30, supplier: 'ScreenTech', broken_count: 3 },
  { qr_id: '1004', name: 'AirPods Pro Case Silicone', category: 'Accessories', buy_price: 400, price: 850, stock: 12, supplier: 'Accs Co', broken_count: 0 },
  { qr_id: '1005', name: 'MagSafe Wireless Powerbank 10000mAh', category: 'Chargers', buy_price: 3500, price: 5500, stock: 8, supplier: 'Anker Supplier', broken_count: 1 },
  { qr_id: '1006', name: 'Braided Type-C to Lightning Cable 2m', category: 'Cables', buy_price: 600, price: 1200, stock: 25, supplier: 'Baseus Direct', broken_count: 0 }
];

const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'SALE-101',
    qr_id: '1001',
    product_name: 'iPhone 15 Pro Case Clear',
    price: 1500,
    buy_price: 1000,
    qty: 5,
    total: 7500,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'SALE-102',
    qr_id: '1002',
    product_name: 'USB-C Fast Charger 20W',
    price: 2500,
    buy_price: 1500,
    qty: 4,
    total: 10000,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'SALE-103',
    qr_id: '1005',
    product_name: 'MagSafe Wireless Powerbank 10000mAh',
    price: 5500,
    buy_price: 3500,
    qty: 3,
    total: 16500,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const INITIAL_BROKEN_RECORDS: BrokenRecord[] = [
  {
    id: 'BRK-101',
    qr_id: '1003',
    product_name: 'Samsung S24 Glass Protector',
    supplier: 'ScreenTech',
    buy_price: 500,
    count: 3,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'BRK-102',
    qr_id: '1002',
    product_name: 'USB-C Fast Charger 20W',
    supplier: 'Anker Supplier',
    buy_price: 1500,
    count: 2,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'BRK-103',
    qr_id: '1001',
    product_name: 'iPhone 15 Pro Case Clear',
    supplier: 'Apple Supplier',
    buy_price: 1000,
    count: 1,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

const INITIAL_DEBTS: DebtRecord[] = [
  {
    id: 'DEBT-101',
    type: 'customer',
    party_name: 'Karim Bennaceur',
    phone: '0550 12 34 56',
    total_amount: 15000,
    paid_amount: 5000,
    notes: 'Bought 3x Powerbanks, will pay balance end of month',
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    status: 'partially_paid',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'DEBT-102',
    type: 'customer',
    party_name: 'Amine Slimani',
    phone: '0661 98 76 54',
    total_amount: 8500,
    paid_amount: 0,
    notes: 'Accessories batch credit',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'DEBT-103',
    type: 'supplier',
    party_name: 'Anker Supplier Co',
    phone: '021 44 55 66',
    total_amount: 45000,
    paid_amount: 20000,
    notes: 'Invoice #ANK-2026-08 for Charger Stock',
    due_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    status: 'partially_paid',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

export const formatPrice = (price: number): string => {
  const p = Number(price) || 0;
  return new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 2 }).format(p) + ' DA';
};

export const getStoredProducts = (): Product[] => {
  const data = localStorage.getItem('boukhari_products');
  if (!data) {
    localStorage.setItem('boukhari_products', JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_PRODUCTS;
  }
};

export const saveProductsToStorage = (products: Product[]) => {
  localStorage.setItem('boukhari_products', JSON.stringify(products));
};

export const getStoredSales = (): SaleRecord[] => {
  const data = localStorage.getItem('boukhari_sales');
  if (!data) {
    localStorage.setItem('boukhari_sales', JSON.stringify(INITIAL_SALES));
    return INITIAL_SALES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_SALES;
  }
};

export const saveSalesToStorage = (sales: SaleRecord[]) => {
  localStorage.setItem('boukhari_sales', JSON.stringify(sales));
};

export const getStoredBrokenRecords = (): BrokenRecord[] => {
  const data = localStorage.getItem('boukhari_broken_records');
  if (!data) {
    localStorage.setItem('boukhari_broken_records', JSON.stringify(INITIAL_BROKEN_RECORDS));
    return INITIAL_BROKEN_RECORDS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_BROKEN_RECORDS;
  }
};

export const saveBrokenRecordsToStorage = (records: BrokenRecord[]) => {
  localStorage.setItem('boukhari_broken_records', JSON.stringify(records));
};

export const getStoredDebts = (): DebtRecord[] => {
  const data = localStorage.getItem('boukhari_debts');
  if (!data) {
    localStorage.setItem('boukhari_debts', JSON.stringify(INITIAL_DEBTS));
    return INITIAL_DEBTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_DEBTS;
  }
};

export const saveDebtsToStorage = (debts: DebtRecord[]) => {
  localStorage.setItem('boukhari_debts', JSON.stringify(debts));
};

export const exportToCSV = (headers: string[], rows: (string | number)[][], filename: string) => {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getCurrentUser = (): User | null => {
  const data = sessionStorage.getItem('boukhari_user');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    sessionStorage.setItem('boukhari_user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('boukhari_user');
    localStorage.removeItem('boukhari_user');
  }
};

export const getPasswords = (): Record<string, string> => {
  const data = localStorage.getItem('boukhari_passwords');
  if (!data) {
    const defaults = { admin: 'admin123', seller: 'seller123' };
    localStorage.setItem('boukhari_passwords', JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(data);
  } catch {
    return { admin: 'admin123', seller: 'seller123' };
  }
};

export const setPassword = (role: 'admin' | 'seller', newPass: string) => {
  const current = getPasswords();
  current[role] = newPass;
  localStorage.setItem('boukhari_passwords', JSON.stringify(current));
};

export const resetPasswordsToDefaultWithMasterKey = (masterKeyInput: string): boolean => {
  if (masterKeyInput.trim().toUpperCase() === 'BOUKHARI-RESET-2026' || masterKeyInput.trim().toUpperCase() === 'MASTER123') {
    const defaults = { admin: 'admin123', seller: 'seller123' };
    localStorage.setItem('boukhari_passwords', JSON.stringify(defaults));
    return true;
  }
  return false;
};

export const toggleSaleGiftClaimedInStorage = (saleId: string): SaleRecord[] => {
  const sales = getStoredSales();
  const updated = sales.map((s) =>
    s.id === saleId ? { ...s, gift_claimed: !s.gift_claimed } : s
  );
  saveSalesToStorage(updated);
  return updated;
};

export const getStoreName = (): string => {
  return localStorage.getItem('boukhari_store_name') || 'BOUKHARI ZONE';
};

export const setStoreName = (name: string) => {
  localStorage.setItem('boukhari_store_name', name.trim() || 'BOUKHARI ZONE');
};

export const exportFullDatabaseJSON = () => {
  const dbData = {
    storeName: getStoreName(),
    products: getStoredProducts(),
    sales: getStoredSales(),
    brokenRecords: getStoredBrokenRecords(),
    debts: getStoredDebts(),
    passwords: getPasswords(),
    exportedAt: new Date().toISOString()
  };
  const jsonStr = JSON.stringify(dbData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bipos_database_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const importFullDatabaseJSON = (jsonString: string): boolean => {
  try {
    const db = JSON.parse(jsonString);
    if (db.storeName && typeof db.storeName === 'string') {
      setStoreName(db.storeName);
    }
    if (db.products && Array.isArray(db.products)) {
      saveProductsToStorage(db.products);
    }
    if (db.sales && Array.isArray(db.sales)) {
      saveSalesToStorage(db.sales);
    }
    if (db.brokenRecords && Array.isArray(db.brokenRecords)) {
      saveBrokenRecordsToStorage(db.brokenRecords);
    }
    if (db.debts && Array.isArray(db.debts)) {
      saveDebtsToStorage(db.debts);
    }
    if (db.passwords && typeof db.passwords === 'object') {
      localStorage.setItem('boukhari_passwords', JSON.stringify(db.passwords));
    }
    return true;
  } catch (err) {
    console.error('Database import error:', err);
    return false;
  }
};


