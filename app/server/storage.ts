import { type User, type InsertUser, type Order, type InsertOrder, type Receipt, type InsertReceipt } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  clearAllOrders(): Promise<void>;
  
  // Receipts
  getReceipt(id: string): Promise<Receipt | undefined>;
  getAllReceipts(): Promise<Receipt[]>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private orders: Map<string, Order>;
  private receipts: Map<string, Receipt>;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.receipts = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByName(name: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt: new Date() 
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...updates };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.orders.delete(id);
  }

  async clearAllOrders(): Promise<void> {
    this.orders.clear();
  }

  // Receipts
  async getReceipt(id: string): Promise<Receipt | undefined> {
    return this.receipts.get(id);
  }

  async getAllReceipts(): Promise<Receipt[]> {
    return Array.from(this.receipts.values()).sort((a, b) => 
      new Date(b.processedAt || 0).getTime() - new Date(a.processedAt || 0).getTime()
    );
  }

  async createReceipt(insertReceipt: InsertReceipt): Promise<Receipt> {
    const id = randomUUID();
    const receipt: Receipt = { 
      ...insertReceipt, 
      id, 
      processedAt: new Date() 
    };
    this.receipts.set(id, receipt);
    return receipt;
  }
}

export const storage = new MemStorage();
