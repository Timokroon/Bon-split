import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  initial: text("initial").notNull(),
  color: text("color").notNull().default("primary"),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userInitial: text("user_initial").notNull(),
  userColor: text("user_color").notNull().default("primary"),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  estimatedPrice: real("estimated_price"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const receipts = pgTable("receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  ocrText: text("ocr_text"),
  restaurantName: text("restaurant_name"),
  receiptDate: timestamp("receipt_date"),
  totalAmount: real("total_amount"),
  items: jsonb("items").$type<ReceiptItem[]>(),
  splitResults: jsonb("split_results").$type<SplitResult[]>(),
  accuracy: real("accuracy"),
  processedAt: timestamp("processed_at").defaultNow(),
});

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SplitResult {
  userId: string;
  userName: string;
  userInitial: string;
  userColor: string;
  items: {
    description: string;
    amount: number;
  }[];
  subtotal: number;
  tipAndTax: number;
  total: number;
}

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  processedAt: true,
});

export const processOrderTextSchema = z.object({
  text: z.string().min(1, "Order text is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type ProcessOrderText = z.infer<typeof processOrderTextSchema>;
