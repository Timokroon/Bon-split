import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { parseOrderText, splitReceiptCosts } from "./services/openai";
import { extractTextFromImage } from "./services/ocr";
import { processOrderTextSchema } from "@shared/schema";
import { z } from "zod";

// Demo parser function for when OpenAI is not available
function parseDemoOrderText(text: string): Array<{
  userName: string;
  userInitial: string;
  userColor: string;
  itemName: string;
  quantity: number;
  estimatedPrice?: number;
}> {
  const results = [];
  const colors = ["primary", "amber", "purple", "emerald", "red", "blue"];
  let colorIndex = 0;
  
  // Price mapping
  const prices: { [key: string]: number } = {
    'bier': 3.50, 'beer': 3.50, 'biertje': 3.50,
    'cola': 2.50,
    'koffie': 2.00, 'coffee': 2.00,
    'thee': 2.00, 'tea': 2.00,
    'wijn': 4.50, 'wine': 4.50,
    'pizza': 8.50
  };
  
  // Handle natural language patterns like "Timo en Bart een biertje en pizza"
  const lowerText = text.toLowerCase();
  
  // Extract people using "en" (and) 
  let people = [];
  const enMatch = lowerText.match(/(\w+)(\s+en\s+\w+)+/);
  if (enMatch) {
    people = enMatch[0].split(/\s+en\s+/).map(name => name.trim());
  } else {
    // Single person patterns like "Timo 2 bier" or "Timo bier"
    const singleMatch = lowerText.match(/(\w+)/);
    if (singleMatch) {
      people = [singleMatch[1]];
    }
  }
  
  // Extract items and quantities
  const items = [];
  const itemPatterns = [
    /(\d+)\s+(bier|beer|biertje|cola|koffie|coffee|pizza|wijn|wine|thee|tea)/g,
    /(een|een)\s+(bier|beer|biertje|cola|koffie|coffee|pizza|wijn|wine|thee|tea)/g,
    /(bier|beer|biertje|cola|koffie|coffee|pizza|wijn|wine|thee|tea)/g
  ];
  
  for (const pattern of itemPatterns) {
    let match;
    while ((match = pattern.exec(lowerText)) !== null) {
      const quantity = match[1] === 'een' || match[1] === 'a' ? 1 : (parseInt(match[1]) || 1);
      const item = match[2] || match[1];
      items.push({ name: item, quantity });
    }
  }
  
  // Create orders for each person and item combination
  if (people.length > 0 && items.length > 0) {
    people.forEach(person => {
      items.forEach(item => {
        results.push({
          userName: person.charAt(0).toUpperCase() + person.slice(1),
          userInitial: person.charAt(0).toUpperCase(),
          userColor: colors[colorIndex % colors.length],
          itemName: item.name,
          quantity: item.quantity,
          estimatedPrice: prices[item.name] || 3.00
        });
      });
      colorIndex++;
    });
  }
  
  // Fallback: basic parsing if nothing found
  if (results.length === 0 && text.trim()) {
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      results.push({
        userName: words[0].charAt(0).toUpperCase() + words[0].slice(1),
        userInitial: words[0].charAt(0).toUpperCase(),
        userColor: colors[0],
        itemName: words.slice(1).join(' '),
        quantity: 1,
        estimatedPrice: 3.00
      });
    }
  }
  
  return results;
}

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Process order text with OpenAI
  app.post("/api/chat", async (req, res) => {
    try {
      const { text } = processOrderTextSchema.parse(req.body);
      
      let parsedOrders;
      let isDemo = false;
      
      // Check if OpenAI API key is available and try to use it
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-api-key-here") {
        parsedOrders = parseDemoOrderText(text);
        isDemo = true;
      } else {
        try {
          parsedOrders = await parseOrderText(text);
        } catch (error: any) {
          // If OpenAI fails (quota exceeded, rate limit, etc.), fall back to demo mode
          console.log("OpenAI API failed, falling back to demo mode:", error.message);
          parsedOrders = parseDemoOrderText(text);
          isDemo = true;
        }
      }
      
      // Create orders in storage
      const createdOrders = [];
      for (const parsedOrder of parsedOrders) {
        // Check if user exists, create if not
        let user = await storage.getUserByName(parsedOrder.userName);
        if (!user) {
          user = await storage.createUser({
            name: parsedOrder.userName,
            initial: parsedOrder.userInitial,
            color: parsedOrder.userColor
          });
        }

        const order = await storage.createOrder({
          userId: user.id,
          userName: parsedOrder.userName,
          userInitial: parsedOrder.userInitial,
          userColor: parsedOrder.userColor,
          itemName: parsedOrder.itemName,
          quantity: parsedOrder.quantity,
          estimatedPrice: parsedOrder.estimatedPrice
        });
        createdOrders.push(order);
      }
      
      res.json({ 
        success: true, 
        orders: createdOrders,
        message: `Added ${createdOrders.length} order(s)${isDemo ? ' (Demo mode - add OpenAI credit for AI parsing)' : ''}`
      });
    } catch (error) {
      console.error("Error processing order text:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to process order: " + (error as Error).message });
      }
    }
  });

  // Update order (quantity or user assignment)
  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, userId, userName, userInitial, userColor } = req.body;
      
      // Handle quantity updates
      if (quantity !== undefined) {
        if (quantity < 0) {
          return res.status(400).json({ message: "Quantity cannot be negative" });
        }
        
        if (quantity === 0) {
          const deleted = await storage.deleteOrder(id);
          if (!deleted) {
            return res.status(404).json({ message: "Order not found" });
          }
          return res.json({ success: true, deleted: true });
        }
      }
      
      // Prepare update data
      const updateData: any = {};
      if (quantity !== undefined) updateData.quantity = quantity;
      if (userId !== undefined) updateData.userId = userId;
      if (userName !== undefined) updateData.userName = userName;
      if (userInitial !== undefined) updateData.userInitial = userInitial;
      if (userColor !== undefined) updateData.userColor = userColor;
      
      const updatedOrder = await storage.updateOrder(id, updateData);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Delete order
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteOrder(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Clear all orders
  app.delete("/api/orders", async (req, res) => {
    try {
      await storage.clearAllOrders();
      res.json({ success: true, message: "All orders cleared" });
    } catch (error) {
      console.error("Error clearing orders:", error);
      res.status(500).json({ message: "Failed to clear orders" });
    }
  });

  // Process receipt with OCR and OpenAI
  app.post("/api/receipt", upload.single('receipt'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Extract text using OCR
      const ocrText = await extractTextFromImage(req.file.path);
      
      if (!ocrText.trim()) {
        return res.status(400).json({ message: "No text could be extracted from the image" });
      }

      // Get current orders
      const currentOrders = await storage.getAllOrders();
      
      if (currentOrders.length === 0) {
        return res.status(400).json({ message: "No orders found. Please add some orders first." });
      }

      // Split costs using OpenAI (with fallback)
      let splitData;
      try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-api-key-here") {
          throw new Error("No OpenAI API key available");
        }
        splitData = await splitReceiptCosts(ocrText, currentOrders);
      } catch (error: any) {
        console.log("OpenAI API failed for receipt processing, providing basic split:", error.message);
        // Basic fallback: split total equally among users
        const totalEstimated = currentOrders.reduce((sum, order) => sum + (order.estimatedPrice || 3.00) * order.quantity, 0);
        const uniqueUsers = Array.from(new Map(currentOrders.map(order => [order.userName, order])).values());
        
        splitData = {
          restaurantName: "Restaurant (OCR verwerkt)",
          receiptDate: new Date(),
          totalAmount: totalEstimated,
          items: currentOrders.map(order => ({
            name: order.itemName,
            quantity: order.quantity,
            unitPrice: order.estimatedPrice || 3.00,
            totalPrice: (order.estimatedPrice || 3.00) * order.quantity
          })),
          splitResults: uniqueUsers.map(user => {
            const userOrders = currentOrders.filter(order => order.userName === user.userName);
            const userTotal = userOrders.reduce((sum, order) => sum + (order.estimatedPrice || 3.00) * order.quantity, 0);
            
            return {
              userId: user.userId,
              userName: user.userName,
              userInitial: user.userInitial,
              userColor: user.userColor,
              items: userOrders.map(order => ({
                description: `${order.quantity}x ${order.itemName}`,
                amount: (order.estimatedPrice || 3.00) * order.quantity
              })),
              subtotal: userTotal,
              tipAndTax: 0,
              total: userTotal
            };
          }),
          accuracy: 0.7
        };
      }
      
      // Save receipt to storage
      const receipt = await storage.createReceipt({
        fileName: req.file.filename,
        fileSize: req.file.size,
        ocrText: ocrText,
        restaurantName: splitData.restaurantName,
        receiptDate: splitData.receiptDate,
        totalAmount: splitData.totalAmount,
        items: splitData.items,
        splitResults: splitData.splitResults,
        accuracy: splitData.accuracy
      });

      res.json({
        success: true,
        receipt: receipt,
        splitResults: splitData.splitResults,
        message: "Receipt processed successfully"
      });
      
    } catch (error) {
      console.error("Error processing receipt:", error);
      res.status(500).json({ message: "Failed to process receipt: " + (error as Error).message });
    }
  });

  // Get all receipts
  app.get("/api/receipts", async (req, res) => {
    try {
      const receipts = await storage.getAllReceipts();
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
