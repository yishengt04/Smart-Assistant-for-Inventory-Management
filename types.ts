
export interface Item {
  id: number | string;
  sku: string;
  name: string;
  category: string;
  reorder_point: number;
  current_stock: number;
  is_hot: boolean;
}

export interface Category {
  id: number;
  name: string;
  prefix: string;
}

export interface InventoryStock {
  item_id: number | string;
  current_quantity: number;
  last_updated: string;
}

export type TransactionType = 'IN' | 'OUT';

export interface InventoryTransaction {
  id: number | string;
  item_id: number | string;
  type: TransactionType;
  quantity: number;
  ref_no: string;
  remarks: string;
  timestamp: string;
  user_id: string;
  user_email: string; // Track who made the change
  staff_name?: string;
  staff_id?: string;
}

export interface User {
  firebase_uid: string;
  staff_id: string;
  name: string;
  status?: 'active' | 'blocked';
  access_level?: 'full_access' | 'read_only';
}

export type View = 'dashboard' | 'items' | 'transactions' | 'history' | 'admin-login' | 'admin-dashboard';
