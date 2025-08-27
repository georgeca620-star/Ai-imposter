import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertGameSchema, insertPlayerSchema, insertMessageSchema } from "@shared/schema";
import { generateAIResponse } from "./services/ai";
import { z } from "zod";

interface GameWebSocket extends WebSocket {
  gameId?: string;
  playerId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time game communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections
  const gameConnections = new Map<string, Set<GameWebSocket>>();

  // Broadcast to all players in a game
  function broadcastToGame(gameId: string, message: any) {
    const connections = gameConnections.get(gameId);
    if (connections) {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }

  // Generate AI response with delay
  async function generateAIResponseDelayed(gameId: string, aiPlayerId: string) {
    setTimeout(async () => {
      try {
        const game = await storage.getGame(gameId);
        if (!game || game.status !== 'discussion') return;

        const players = await storage.getPlayersByGame(gameId);
        const messages = await storage.getMessagesByGame(gameId);
        const aiPlayer = players.find(p => p.id === aiPlayerId);
        
        if (!aiPlayer) return;

        const messageHistory = messages.map(msg => {
          const player = players.find(p => p.id === msg.playerId);
          return {
            playerName: player?.name || 'Unknown',
            content: msg.content,
            isAI: player?.isAI || false
          };
        });

        const aiResponse = await generateAIResponse(game.aiPersonality, {
          messages: messageHistory,
          players: players,
          gamePhase: game.status
        });

        const aiMessage = await storage.createMessage({
          gameId,
          playerId: aiPlayerId,
          content: aiResponse
        });

        broadcastToGame(gameId, {
          type: 'message',
          message: aiMessage,
          player: aiPlayer
        });
      } catch (error) {
        console.error('AI response error:', error);
      }
    }, 2000 + Math.random() * 3000); // 2-5 second delay
  }

  wss.on('connection', (ws: GameWebSocket) => {
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join') {
          ws.gameId = message.gameId;
          ws.playerId = message.playerId;
          
          if (!gameConnections.has(message.gameId)) {
            gameConnections.set(message.gameId, new Set());
          }
          gameConnections.get(message.gameId)!.add(ws);
          
          // Send current game state
          const game = await storage.getGame(message.gameId);
          const players = await storage.getPlayersByGame(message.gameId);
          const messages = await storage.getMessagesByGame(message.gameId);
          
          ws.send(JSON.stringify({
            type: 'gameState',
            game,
            players,
            messages
          }));
        }
        
        if (message.type === 'sendMessage') {
          const newMessage = await storage.createMessage({
            gameId: ws.gameId!,
            playerId: ws.playerId!,
            content: message.content
          });
          
          const player = await storage.getPlayer(ws.playerId!);
          
          broadcastToGame(ws.gameId!, {
            type: 'message',
            message: newMessage,
            player
          });

          // Trigger AI response if there's an AI player
          const game = await storage.getGame(ws.gameId!);
          if (game?.aiPlayerId && game.status === 'discussion') {
            generateAIResponseDelayed(ws.gameId!, game.aiPlayerId);
          }
        }
        
        if (message.type === 'vote') {
          await storage.updatePlayer(ws.playerId!, { vote: message.targetPlayerId });
          
          // Check if all human players have voted
          const players = await storage.getPlayersByGame(ws.gameId!);
          const humanPlayers = players.filter(p => !p.isAI);
          const votedPlayers = humanPlayers.filter(p => p.vote);
          
          if (votedPlayers.length === humanPlayers.length) {
            // End voting phase
            await storage.updateGame(ws.gameId!, { status: 'ended' });
            
            // Calculate results
            const voteCount = new Map<string, number>();
            players.forEach(player => {
              if (player.vote) {
                voteCount.set(player.vote, (voteCount.get(player.vote) || 0) + 1);
              }
            });
            
            const aiPlayer = players.find(p => p.isAI);
            const aiVotes = voteCount.get(aiPlayer?.id || '') || 0;
            const totalVotes = Array.from(voteCount.values()).reduce((a, b) => a + b, 0);
            const aiWins = totalVotes === 0 || aiVotes < totalVotes / 2;
            
            broadcastToGame(ws.gameId!, {
              type: 'gameEnded',
              results: {
                aiWins,
                aiPlayer,
                voteResults: Array.from(voteCount.entries()).map(([playerId, votes]) => ({
                  player: players.find(p => p.id === playerId),
                  votes
                }))
              }
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (ws.gameId && gameConnections.has(ws.gameId)) {
        gameConnections.get(ws.gameId)!.delete(ws);
      }
    });
  });

  // Create game room
  app.post("/api/games", async (req, res) => {
    try {
      const { roomCode, createdBy, aiPersonality = 'casual' } = insertGameSchema.parse(req.body);
      
      const game = await storage.createGame({
        roomCode,
        createdBy,
        aiPersonality,
        status: 'lobby',
        discussionTimeLeft: null,
        votingTimeLeft: null,
        aiPlayerId: null
      });

      res.json(game);
    } catch (error) {
      res.status(400).json({ error: "Failed to create game" });
    }
  });

  // Join game room
  app.post("/api/games/:roomCode/join", async (req, res) => {
    try {
      const { roomCode } = req.params;
      const { name } = z.object({ name: z.string().min(1).max(50) }).parse(req.body);
      
      const game = await storage.getGameByRoomCode(roomCode);
      if (!game) {
        return res.status(404).json({ error: "Game room not found" });
      }

      const players = await storage.getPlayersByGame(game.id);
      if (players.length >= 8) {
        return res.status(400).json({ error: "Game room is full" });
      }

      const player = await storage.createPlayer({
        gameId: game.id,
        name,
        isAI: false,
        isConnected: true,
        vote: null
      });

      res.json({ game, player });
    } catch (error) {
      res.status(400).json({ error: "Failed to join game" });
    }
  });

  // Start game
  app.post("/api/games/:gameId/start", async (req, res) => {
    try {
      const { gameId } = req.params;
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const players = await storage.getPlayersByGame(gameId);
      if (players.length < 4) {
        return res.status(400).json({ error: "Need at least 4 players to start" });
      }

      // Add AI player
      const aiNames = ['Mike_777', 'Sarah_AI', 'Alex_Bot', 'Jamie_X', 'Taylor_99'];
      const aiName = aiNames[Math.floor(Math.random() * aiNames.length)];
      
      const aiPlayer = await storage.createPlayer({
        gameId,
        name: aiName,
        isAI: true,
        isConnected: true,
        vote: null
      });

      // Start discussion phase
      const discussionEndTime = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes
      await storage.updateGame(gameId, {
        status: 'discussion',
        aiPlayerId: aiPlayer.id,
        discussionTimeLeft: discussionEndTime
      });

      const updatedGame = await storage.getGame(gameId);
      const allPlayers = await storage.getPlayersByGame(gameId);

      res.json({ game: updatedGame, players: allPlayers });
    } catch (error) {
      res.status(400).json({ error: "Failed to start game" });
    }
  });

  // Get game state
  app.get("/api/games/:gameId", async (req, res) => {
    try {
      const { gameId } = req.params;
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const players = await storage.getPlayersByGame(gameId);
      const messages = await storage.getMessagesByGame(gameId);

      res.json({ game, players, messages });
    } catch (error) {
      res.status(500).json({ error: "Failed to get game state" });
    }
  });

  return httpServer;
}
