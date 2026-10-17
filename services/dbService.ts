
import { sql } from '../neonClient';
import { Item, InventoryTransaction, TransactionType, Category, User } from '../types';

export const dbService = {
  /**
   * Fetch ALL inventory items (Team View)
   */
  getInventory: async (): Promise<Item[]> => {
    try {
      const rows = await sql`
        SELECT * FROM items 
        ORDER BY name ASC
      `;
      return rows.map(r => ({
        id: r.id,
        sku: r.sku,
        name: r.name,
        category: r.category,
        reorder_point: r.reorder_point,
        current_stock: r.current_stock,
        is_hot: r.is_hot || false
      }));
    } catch (error) {
      console.error("SQL Error in getInventory:", error);
      throw error;
    }
  },

  /**
   * Fetch ALL transaction history (Team View)
   */
  getTransactions: async (): Promise<InventoryTransaction[]> => {
    try {
      const rows = await sql`
        SELECT * FROM transactions 
        ORDER BY timestamp DESC
      `;
      return rows.map(r => ({
        id: r.id,
        item_id: r.item_id,
        type: r.type as TransactionType,
        quantity: r.quantity,
        ref_no: r.ref_no,
        remarks: r.remarks,
        timestamp: r.timestamp,
        user_id: r.user_id,
        user_email: r.user_email || 'N/A',
        staff_name: r.staff_name,
        staff_id: r.staff_id
      }));
    } catch (error) {
      console.error("SQL Error in getTransactions:", error);
      throw error;
    }
  },

  /**
   * Fetch all categories
   */
  getCategories: async (): Promise<Category[]> => {
    try {
      const rows = await sql`SELECT * FROM categories ORDER BY name ASC`;
      return rows.map(r => ({ id: r.id, name: r.name, prefix: r.prefix }));
    } catch (error) {
      console.error("SQL Error in getCategories:", error);
      throw error;
    }
  },

  /**
   * Add a new category
   */
  addCategory: async (name: string, prefix: string) => {
    try {
      const result = await sql`
        INSERT INTO categories (name, prefix)
        VALUES (${name}, ${prefix})
        ON CONFLICT (name) DO UPDATE SET prefix = EXCLUDED.prefix
        RETURNING *
      `;
      return result[0];
    } catch (error) {
      console.error("SQL Error in addCategory:", error);
      throw error;
    }
  },

  /**
   * Add a new item (Team accessible)
   */
  addItem: async (item: Omit<Item, 'id' | 'current_stock'>, userId: string) => {
    try {
      const result = await sql`
        INSERT INTO items (user_id, name, sku, category, reorder_point, current_stock, is_hot)
        VALUES (${userId}, ${item.name}, ${item.sku}, ${item.category}, ${item.reorder_point}, 0, ${item.is_hot})
        RETURNING *
      `;
      return result[0];
    } catch (error) {
      console.error("SQL Error in addItem:", error);
      throw error;
    }
  },

  /**
   * Update an existing item
   */
  updateItem: async (id: number | string, item: Partial<Omit<Item, 'id' | 'sku' | 'current_stock'>>) => {
    try {
      const result = await sql`
        UPDATE items 
        SET 
          name = ${item.name}, 
          category = ${item.category}, 
          reorder_point = ${item.reorder_point}, 
          is_hot = ${item.is_hot}
        WHERE id = ${id}
        RETURNING *
      `;
      return result[0];
    } catch (error) {
      console.error("SQL Error in updateItem:", error);
      throw error;
    }
  },

  /**
   * Process a stock transaction with email tracking
   */
  processTransaction: async (data: {
    item_id: number | string;
    type: TransactionType;
    quantity: number;
    ref_no: string;
    remarks: string;
    user_email: string;
    staff_name?: string;
    staff_id?: string;
  }, userId: string) => {
    try {
      const change = data.type === 'IN' ? data.quantity : -data.quantity;

      // 1. Insert Transaction record with email and staff info
      await sql`
        INSERT INTO transactions (user_id, user_email, item_id, type, quantity, ref_no, remarks, staff_name, staff_id)
        VALUES (${userId}, ${data.user_email}, ${data.item_id}, ${data.type}, ${data.quantity}, ${data.ref_no}, ${data.remarks}, ${data.staff_name || null}, ${data.staff_id || null})
      `;

      // 2. Update item stock level (Global)
      const updateResult = await sql`
        UPDATE items 
        SET current_stock = current_stock + ${change}
        WHERE id = ${data.item_id}
        RETURNING current_stock
      `;

      if (updateResult.length === 0) {
        throw new Error("Item not found.");
      }

      if (updateResult[0].current_stock < 0) {
        await sql`UPDATE items SET current_stock = current_stock - ${change} WHERE id = ${data.item_id}`;
        throw new Error("Insufficient stock to complete this transaction.");
      }

      return updateResult[0];
    } catch (error) {
      console.error("SQL Error in processTransaction:", error);
      throw error;
    }
  },

  /**
   * User Management & Onboarding
   */
  getUser: async (uid: string): Promise<User | null> => {
    try {
      const rows = await sql`SELECT * FROM users WHERE firebase_uid = ${uid}`;
      if (rows.length === 0) return null;
      return {
        firebase_uid: rows[0].firebase_uid,
        staff_id: rows[0].staff_id,
        name: rows[0].name,
        status: rows[0].status || 'active',
        access_level: rows[0].access_level || 'full_access'
      };
    } catch (error) {
      console.error("SQL Error in getUser:", error);
      return null;
    }
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      const rows = await sql`SELECT * FROM users ORDER BY staff_id ASC`;
      return rows.map(r => ({
        firebase_uid: r.firebase_uid,
        staff_id: r.staff_id,
        name: r.name,
        status: r.status || 'active',
        access_level: r.access_level || 'full_access'
      }));
    } catch (error) {
      console.error("SQL Error in getAllUsers:", error);
      throw error;
    }
  },

  updateUserStatus: async (uid: string, status: 'active' | 'blocked') => {
    try {
      await sql`UPDATE users SET status = ${status} WHERE firebase_uid = ${uid}`;
    } catch (error) {
      console.error("SQL Error in updateUserStatus:", error);
      throw error;
    }
  },

  updateUserAccessLevel: async (uid: string, accessLevel: 'full_access' | 'read_only') => {
    try {
      await sql`UPDATE users SET access_level = ${accessLevel} WHERE firebase_uid = ${uid}`;
    } catch (error) {
      console.error("SQL Error in updateUserAccessLevel:", error);
      throw error;
    }
  },

  getUserTransactions: async (staffId: string): Promise<InventoryTransaction[]> => {
    try {
      const rows = await sql`
        SELECT * FROM transactions 
        WHERE staff_id = ${staffId}
        ORDER BY timestamp DESC
      `;
      return rows.map(r => ({
        id: r.id,
        item_id: r.item_id,
        type: r.type as TransactionType,
        quantity: r.quantity,
        ref_no: r.ref_no,
        remarks: r.remarks,
        timestamp: r.timestamp,
        user_id: r.user_id,
        user_email: r.user_email || 'N/A',
        staff_name: r.staff_name,
        staff_id: r.staff_id
      }));
    } catch (error) {
      console.error("SQL Error in getUserTransactions:", error);
      throw error;
    }
  },

  deleteUser: async (uid: string) => {
    try {
      await sql`DELETE FROM users WHERE firebase_uid = ${uid}`;
    } catch (error) {
      console.error("SQL Error in deleteUser:", error);
      throw error;
    }
  },

  getNextStaffId: async (): Promise<string> => {
    try {
      const rows = await sql`SELECT staff_id FROM users ORDER BY staff_id DESC LIMIT 1`;
      if (rows.length === 0) return 'S001';
      
      const lastId = rows[0].staff_id; // e.g., "S005"
      const num = parseInt(lastId.substring(1));
      const nextNum = (num + 1).toString().padStart(3, '0');
      return `S${nextNum}`;
    } catch (error) {
      console.error("SQL Error in getNextStaffId:", error);
      return 'S001';
    }
  },

  createUser: async (user: User) => {
    try {
      await sql`
        INSERT INTO users (firebase_uid, staff_id, name)
        VALUES (${user.firebase_uid}, ${user.staff_id}, ${user.name})
      `;
    } catch (error) {
      console.error("SQL Error in createUser:", error);
      throw error;
    }
  },

  /**
   * Run Migrations (Ensures new tables and columns exist)
   */
  runMigrations: async () => {
    try {
      // Create users table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          firebase_uid TEXT PRIMARY KEY,
          staff_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
          access_level TEXT DEFAULT 'full_access' CHECK (access_level IN ('full_access', 'read_only')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Add status column to users if it doesn't exist
      try {
        await sql`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked'))`;
      } catch (e) { /* Column might already exist */ }

      // Add access_level column to users if it doesn't exist
      try {
        await sql`ALTER TABLE users ADD COLUMN access_level TEXT DEFAULT 'full_access' CHECK (access_level IN ('full_access', 'read_only'))`;
      } catch (e) { /* Column might already exist */ }

      // Create categories table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          prefix TEXT UNIQUE NOT NULL
        )
      `;

      // Add prefix column to categories if it doesn't exist (for existing tables)
      try {
        await sql`ALTER TABLE categories ADD COLUMN prefix TEXT UNIQUE`;
      } catch (e) { /* Column might already exist */ }

      // Add staff columns to transactions if they don't exist
      try {
        await sql`ALTER TABLE transactions ADD COLUMN staff_name TEXT`;
      } catch (e) { /* Column might already exist */ }
      
      try {
        await sql`ALTER TABLE transactions ADD COLUMN staff_id TEXT`;
      } catch (e) { /* Column might already exist */ }

      console.log("Migrations completed successfully");
    } catch (error) {
      console.error("Migration Error:", error);
    }
  }
};
