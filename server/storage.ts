import { type Game, type InsertGame, type Player, type InsertPlayer, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Game methods
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: string): Promise<Game | undefined>;
  getGameByRoomCode(roomCode: string): Promise<Game | undefined>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined>;
  
  // Player methods
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayersByGame(gameId: string): Promise<Player[]>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByGame(gameId: string): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private games: Map<string, Game>;
  private players: Map<string, Player>;
  private messages: Map<string, Message>;

  constructor() {
    this.games = new Map();
    this.players = new Map();
    this.messages = new Map();
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = randomUUID();
    const game: Game = { 
      ...insertGame, 
      id,
      createdAt: new Date()
    };
    this.games.set(id, game);
    return game;
  }

  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGameByRoomCode(roomCode: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(game => game.roomCode === roomCode);
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = { 
      ...insertPlayer, 
      id,
      joinedAt: new Date()
    };
    this.players.set(id, player);
    return player;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayersByGame(gameId: string): Promise<Player[]> {
    return Array.from(this.players.values()).filter(player => player.gameId === gameId);
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...updates };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      ...insertMessage, 
      id,
      timestamp: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByGame(gameId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.gameId === gameId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const storage = new MemStorage();
