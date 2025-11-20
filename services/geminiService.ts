
import { GoogleGenAI } from "@google/genai";

const FALLBACK_MSG = "System offline. Try again.";

export const generateFlavorText = async (result: 'VICTORY' | 'GAME_OVER', levelIndex: number): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Mission Complete.";

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = result === 'VICTORY'
      ? "You are a futuristic military AI. The pilot has destroyed the final CORE. Write a short, epic, congratulatory message (max 1 sentence)."
      : `You are a futuristic military AI. The pilot died at Sector ${levelIndex + 1}. Write a short, sarcastic failure message (max 1 sentence).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || (result === 'VICTORY' ? "Protocol Complete." : "Signal Lost.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return result === 'VICTORY' ? "Protocol Verified." : "Connection Terminated.";
  }
};
