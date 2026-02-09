import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface RitualSuggestion {
  title: string;
  description: string;
  difficulty: "novice" | "adept" | "master";
}

export const generateRitualSuggestions = async (goal: string): Promise<RitualSuggestion[]> => {
  if (!apiKey || !genAI) {
    console.warn("No API Key available for Gemini. Using fallback suggestions.");
    return getFallbackSuggestions(goal);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `Generate 3 distinct habit suggestions (Rituals) for someone who wants to achieve this goal: "${goal}". 
Keep the tone dark, serious, and disciplined (Stoic/Gothic). Each ritual should be challenging and meaningful.
Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Ritual name",
    "description": "Detailed description",
    "difficulty": "novice" | "adept" | "master"
  }
]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          title: item.title || "Unknown Ritual",
          description: item.description || "",
          difficulty: ["novice", "adept", "master"].includes(item.difficulty) 
            ? item.difficulty 
            : "novice"
        }));
      }
    }
    
    return getFallbackSuggestions(goal);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return getFallbackSuggestions(goal);
  }
};

function getFallbackSuggestions(goal: string): RitualSuggestion[] {
  const shortGoal = goal.length > 20 ? goal.substring(0, 20) + "..." : goal;
  return [
    { 
      title: `Protocol: ${shortGoal}`, 
      description: `Daily rigorous training focused on ${goal}. No excuses.`, 
      difficulty: "adept" as const
    },
    { 
      title: `Path of the ${shortGoal}`, 
      description: `Small consistent steps towards ${goal}.`, 
      difficulty: "novice" as const
    },
    { 
      title: `Mastery of ${shortGoal}`, 
      description: `Extreme immersion in ${goal}. Suffering is guaranteed.`, 
      difficulty: "master" as const
    }
  ];
}
