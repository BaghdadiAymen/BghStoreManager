export type Role = 'admin' | 'seller';

export interface User {
  username: string;
  role: Role;
}

export interface Product {
  qr_id: string;
  name: string;
  category: string;
  buy_price: number;
  price: number;
  stock: number;
  supplier: string;
  broken_count?: number;
}

export interface CartItem {
  qr_id: string;
  name: string;
  category: string;
  buy_price: number;
  price: number;
  qty: number;
  stock: number;
}

export interface SaleRecord {
  id: string;
  qr_id: string;
  product_name: string;
  price: number;
  buy_price: number;
  qty: number;
  total: number;
  created_at: string;
  gift_claimed?: boolean;
  customer_name?: string;
  gift_note?: string;
}

export interface BrokenRecord {
  id: string;
  qr_id: string;
  product_name: string;
  supplier: string;
  buy_price: number;
  count: number;
  created_at: string;
}

export interface DebtRecord {
  id: string;
  type: 'customer' | 'supplier'; // 'customer' = money owed to us, 'supplier' = money we owe
  party_name: string;
  phone?: string;
  total_amount: number;
  paid_amount: number;
  notes?: string;
  due_date?: string;
  status: 'pending' | 'partially_paid' | 'paid';
  created_at: string;
  updated_at: string;
}

export type ActiveTab = 'pos' | 'stock' | 'sales' | 'analytics' | 'debts' | 'about';

