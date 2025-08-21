import OpenAI from "openai";
import { type Order, type ReceiptItem, type SplitResult } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "your-api-key-here"
});

export interface ParsedOrder {
  userName: string;
  userInitial: string;
  userColor: string;
  itemName: string;
  quantity: number;
  estimatedPrice?: number;
}

export async function parseOrderText(text: string): Promise<ParsedOrder[]> {
  try {
    const prompt = `Parse this Dutch/English order text and extract structured information about who ordered what. Handle natural language patterns.
    
Order text: "${text}"

Please return a JSON array of orders with this exact format:
{
  "orders": [
    {
      "userName": "string (full name)",
      "userInitial": "string (first letter of name, uppercase)",
      "userColor": "string (use colors: primary, amber, purple, emerald, red, blue)",
      "itemName": "string (item/drink name)",
      "quantity": number,
      "estimatedPrice": number (estimate in euros)
    }
  ]
}

Rules for parsing natural language:
- Handle "Timo en Bart een biertje en pizza" = Timo gets 1 beer + 1 pizza, Bart gets 1 beer + 1 pizza  
- Handle "Timo en Bart 2 bier" = Timo gets 1 beer, Bart gets 1 beer (split evenly)
- Handle "Timo 2 bier, Bart cola" = Timo gets 2 beers, Bart gets 1 cola
- Handle "Timo bier" = Timo gets 1 beer
- If multiple people mentioned with "en" (and), give each person each item mentioned
- Use Dutch/English variants: bier=beer, cola=cola, koffie=coffee, pizza=pizza, etc.
- Different colors for each person (primary, amber, purple, emerald, red, blue)
- Price estimates: bier/beer=3.50, cola=2.50, koffie/coffee=2.00, pizza=8.50, wijn/wine=4.50
- Always return at least one order if valid text provided`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at parsing order text and extracting structured data. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.orders || [];
  } catch (error) {
    console.error("Error parsing order text:", error);
    throw new Error("Failed to parse order text: " + (error as Error).message);
  }
}

export async function splitReceiptCosts(
  ocrText: string, 
  currentOrders: Order[]
): Promise<{
  restaurantName?: string;
  receiptDate?: Date;
  totalAmount?: number;
  items: ReceiptItem[];
  splitResults: SplitResult[];
  accuracy: number;
}> {
  try {
    const ordersText = currentOrders.map(order => 
      `${order.userName}: ${order.quantity}x ${order.itemName}`
    ).join(", ");

    const prompt = `Analyze this receipt text and split the costs based on the group orders.

Receipt OCR text:
"${ocrText}"

Group orders:
${ordersText}

Please return JSON with this exact format:
{
  "restaurantName": "string (restaurant name from receipt)",
  "receiptDate": "string (ISO date if found)",
  "totalAmount": number,
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "splitResults": [
    {
      "userId": "string (use userName as ID)",
      "userName": "string",
      "userInitial": "string",
      "userColor": "string (same as in orders)",
      "items": [
        {
          "description": "string (e.g., '2x Heineken')",
          "amount": number
        }
      ],
      "subtotal": number,
      "tipAndTax": number (proportional share),
      "total": number
    }
  ],
  "accuracy": number (0-1, confidence in OCR and matching)
}

Rules:
- Match receipt items to group orders as closely as possible
- Distribute tip, tax, and service charges proportionally
- If items don't match exactly, make reasonable assumptions
- Calculate individual totals that sum to the receipt total
- Provide accuracy score based on how well items matched`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing receipts and splitting costs fairly among group members. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      restaurantName: result.restaurantName,
      receiptDate: result.receiptDate ? new Date(result.receiptDate) : undefined,
      totalAmount: result.totalAmount,
      items: result.items || [],
      splitResults: result.splitResults || [],
      accuracy: result.accuracy || 0.5
    };
  } catch (error) {
    console.error("Error splitting receipt costs:", error);
    throw new Error("Failed to analyze receipt: " + (error as Error).message);
  }
}
