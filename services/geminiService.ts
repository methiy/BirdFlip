import { GoogleGenAI } from "@google/genai";

const FALLBACK_MSG = "System offline. Try again.";

export const generateFlavorText = async (result: 'VICTORY' | 'GAME_OVER', setsCollected: number): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Mission Complete.";

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = result === 'VICTORY'
      ? "You are a futuristic AI system. The pilot has successfully completed the impossible 'Gemini Protocol'. Write a short, cryptic but congratulatory message (max 1 sentence)."
      : `You are a futuristic AI system. The pilot crashed after collecting ${setsCollected} data fragments. Write a short, sarcastic or cold failure message (max 1 sentence).`;

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
