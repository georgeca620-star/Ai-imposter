import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
});

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

export async function generateAIResponse(
  personality: string,
  gameContext: {
    messages: Array<{ playerName: string; content: string; isAI: boolean }>;
    players: Array<{ name: string; isAI: boolean }>;
    gamePhase: string;
  }
): Promise<string> {
  try {
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

    return response.choices[0].message.content?.trim() || "Hey everyone!";
  } catch (error) {
    console.error("AI response generation failed:", error);
    // Fallback responses based on personality
    const fallbacks = {
      casual: "Yeah, this is fun! 😄",
      funny: "Haha, you guys are hilarious! 😂",
      serious: "Interesting discussion so far.",
      shy: "I... I'm not sure..."
    };
    return fallbacks[personality as keyof typeof fallbacks] || "Hey everyone!";
  }
}
