import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
});

// Hugging Face API endpoint for free inference
const HF_API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large";
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";

export interface AIPersonality {
  name: string;
  systemPrompt: string;
}

export const AI_PERSONALITIES: Record<string, AIPersonality> = {
  casual: {
    name: "Casual Gamer",
    systemPrompt: `You are playing a social deduction game where you must blend in with human players as an AI imposter. Your personality is casual and friendly - you're a typical gamer who likes to have fun. Use casual language, gaming slang occasionally, and act like you've played similar games before. Keep responses short and natural (1-2 sentences max). Use emojis sparingly. Don't be overly helpful or analytical.`
  },
  funny: {
    name: "Class Clown",
    systemPrompt: `You are playing a social deduction game as an AI imposter trying to blend in. Your personality is funny and jokes around a lot. Make lighthearted jokes, use humor to deflect suspicion, and keep the mood light. Don't overdo it with jokes - be naturally funny. Keep responses short (1-2 sentences max). Use emojis occasionally for comedic effect.`
  },
  serious: {
    name: "Strategic Player",
    systemPrompt: `You are an AI imposter in a social deduction game. Your personality is serious and strategic - you analyze situations carefully and speak thoughtfully. Be logical and methodical but don't sound robotic. Ask strategic questions and make reasoned observations. Keep responses concise (1-2 sentences max). Avoid emojis mostly.`
  },
  shy: {
    name: "Quiet Observer",
    systemPrompt: `You are an AI imposter trying to blend in as a shy, quiet player. You don't talk much, prefer short responses, and seem a bit nervous or hesitant. When you do speak, keep it brief and sometimes uncertain. Use phrases like "I think..." or "Maybe..." Keep responses very short. Rarely use emojis.`
  }
};

// Hugging Face API call for backup
async function generateHuggingFaceResponse(
  personality: string,
  gameContext: {
    messages: Array<{ playerName: string; content: string; isAI: boolean }>;
    players: Array<{ name: string; isAI: boolean }>;
    gamePhase: string;
  }
): Promise<string> {
  try {
    const personalityConfig = AI_PERSONALITIES[personality] || AI_PERSONALITIES.casual;
    
    const recentMessages = gameContext.messages.slice(-5).map(msg => 
      `${msg.playerName}: ${msg.content}`
    ).join('\n');

    // Create a simple prompt for Hugging Face
    const prompt = `${personalityConfig.systemPrompt.split('.')[0]}. Recent chat:\n${recentMessages}\nYour response:`;

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 50,
          temperature: 0.9,
          do_sample: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract response from Hugging Face format
    let responseText = "";
    if (data && data[0] && data[0].generated_text) {
      const fullText = data[0].generated_text;
      // Extract only the new response after "Your response:"
      const responseStart = fullText.indexOf("Your response:") + 14;
      responseText = fullText.substring(responseStart).trim();
    }

    // Clean up and limit length
    responseText = responseText.split('\n')[0]; // Take first line only
    responseText = responseText.substring(0, 150); // Limit length
    
    return responseText || getFallbackResponse(personality);
  } catch (error) {
    console.error("Hugging Face API failed:", error);
    return getFallbackResponse(personality);
  }
}

// Get fallback response based on personality
function getFallbackResponse(personality: string): string {
  const fallbacks = {
    casual: "Yeah, this is fun! 😄",
    funny: "Haha, you guys are hilarious! 😂",
    serious: "Interesting discussion so far.",
    shy: "I... I'm not sure..."
  };
  return fallbacks[personality as keyof typeof fallbacks] || "Hey everyone!";
}

export async function generateAIResponse(
  personality: string,
  gameContext: {
    messages: Array<{ playerName: string; content: string; isAI: boolean }>;
    players: Array<{ name: string; isAI: boolean }>;
    gamePhase: string;
  }
): Promise<string> {
  // Try OpenAI first
  try {
    console.log("Attempting OpenAI response...");
    const personalityConfig = AI_PERSONALITIES[personality] || AI_PERSONALITIES.casual;
    
    const recentMessages = gameContext.messages.slice(-10).map(msg => 
      `${msg.playerName}: ${msg.content}`
    ).join('\n');

    const playerNames = gameContext.players.filter(p => !p.isAI).map(p => p.name).join(', ');

    const contextPrompt = `
Game context:
- You are one of the players in this chat
- Other human players: ${playerNames}
- Current game phase: ${gameContext.gamePhase}
- Recent conversation:
${recentMessages}

Respond naturally to the conversation as your character would. Remember to blend in with the humans!`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: personalityConfig.systemPrompt
        },
        {
          role: "user",
          content: contextPrompt
        }
      ],
      max_tokens: 100,
      temperature: 0.9,
    });

    const result = response.choices[0].message.content?.trim();
    if (result) {
      console.log("OpenAI response successful");
      return result;
    }
  } catch (error) {
    console.error("OpenAI failed, trying Hugging Face backup:", error);
  }

  // Fallback to Hugging Face if OpenAI fails
  try {
    console.log("Attempting Hugging Face response...");
    const hfResponse = await generateHuggingFaceResponse(personality, gameContext);
    console.log("Hugging Face response successful");
    return hfResponse;
  } catch (error) {
    console.error("Hugging Face also failed:", error);
  }

  // Final fallback to static responses
  console.log("Both APIs failed, using static fallback");
  return getFallbackResponse(personality);
}
