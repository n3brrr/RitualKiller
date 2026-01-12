import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // Fallback to empty to prevent crash, handled in UI
const ai = new GoogleGenAI({ apiKey });

export const generateRitualSuggestions = async (goal: string): Promise<any[]> => {
  if (!apiKey) {
    console.warn("No API Key available for Gemini.");
    return [
      { title: "Morning Meditation", description: "Clear your mind for 10 minutes.", difficulty: "novice" },
      { title: "Deep Work", description: "90 minutes of distracted work.", difficulty: "adept" },
      { title: "Cold Shower", description: "Face the cold to steel your will.", difficulty: "master" }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 3 distinct habit suggestions (Rituals) for someone who wants to achieve this goal: "${goal}". 
      Keep the tone dark, serious, and disciplined (Stoic/Gothic). 
      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["novice", "adept", "master"] }
            },
            required: ["title", "description", "difficulty"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};
