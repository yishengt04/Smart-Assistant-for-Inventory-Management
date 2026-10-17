declare const process: any;
import { GoogleGenAI } from "@google/genai";
import { Item, InventoryStock, InventoryTransaction } from "../types";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getInventoryInsights = async (items: Item[], stocks: InventoryStock[]) => {
  const ai = getAI();
  
  const itemsData = items.map(i => ({
    name: i.name,
    stock: i.current_stock,
    reorder: i.reorder_point,
    hot: i.is_hot
  }));
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this inventory data and provide reorder recommendations. Format your response as a clean, numbered list without any markdown symbols (no asterisks, no bold text). Prioritize hot items.

      Inventory data: ${JSON.stringify(itemsData)}

      Provide your response in this exact format:
      1. [Item name] - Current: X, Reorder at: Y - ACTION NEEDED/OK
      2. [Item name] - Current: X, Reorder at: Y - ACTION NEEDED/OK

      Split the items in sections with urgent items first then low stock items then healthy items.
      Then add a brief summary section listing only items that need immediate attention.
      Lastly, based on your observation give a brief summary from your opinion about our inventory health and level`,
      config: {
      systemInstruction: "You are an inventory analyst. Provide clear, structured responses without markdown formatting. No asterisks. Use plain text only with numbered lists and simple dashes."
      }
  });
  
  return response.text;
};

export const askSmartAssistant = async (
  userMessage: string, 
  items: Item[], 
  recentTransactions: InventoryTransaction[]
) => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: userMessage,
    config: {
      systemInstruction: `You are a helpful inventory assistant. Keep responses brief and to the point (2-3 sentences max unless asked for details). 

      CRITICAL RULES:
      - Never use markdown: no asterisks (*), no bold, no italics, no headers (#)
      - Write in plain text only
      - Be conversational but concise
      - Answer directly without preamble
      - Use simple numbered lists or bullet points with dashes (-) only when necessary

      Current inventory data: ${JSON.stringify({ 
        items: items.slice(0, 20), // Limit data to avoid token bloat
        recentTransactions: recentTransactions.slice(0, 10) 
      })}`
    }
  });
  
  return response.text;
};