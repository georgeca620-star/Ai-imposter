import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { DemoAdBanner } from '@/components/ad-banner';

export default function Lobby() {
  const [, setLocation] = useLocation();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const newRoomCode = generateRoomCode();
      const response = await apiRequest('POST', '/api/games', {
        roomCode: newRoomCode,
        createdBy: playerName.trim(),
        aiPersonality: 'casual'
      });

      const game = await response.json();
      
      // Join the created game
      const joinResponse = await apiRequest('POST', `/api/games/${newRoomCode}/join`, {
        name: playerName.trim()
      });

      const { player } = await joinResponse.json();
      
      // Store player info in localStorage
      localStorage.setItem('currentPlayer', JSON.stringify(player));
      localStorage.setItem('currentGame', JSON.stringify(game));
      
      setLocation(`/game/${game.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter both room code and your name",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);
    try {
      const response = await apiRequest('POST', `/api/games/${roomCode.toUpperCase()}/join`, {
        name: playerName.trim()
      });

      const { game, player } = await response.json();
      
      // Store player info in localStorage
      localStorage.setItem('currentPlayer', JSON.stringify(player));
      localStorage.setItem('currentGame', JSON.stringify(game));
      
      setLocation(`/game/${game.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join room. Check the room code.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-md mx-auto">
        {/* Logo Section */}
        <div className="text-center mb-12 mt-16">
          <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 pulse-glow">
            <i className="fas fa-mask text-primary-foreground text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Imposter</h1>
          <p className="text-muted-foreground">Find the AI hiding among humans</p>
        </div>

        {/* Player Name Input */}
        <div className="mb-8">
          <Input 
            type="text" 
            placeholder="Enter your name" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            data-testid="input-player-name"
          />
        </div>

        {/* Main Actions */}
        <div className="space-y-4 mb-8">
          <Button 
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-create-room"
          >
            <i className="fas fa-plus mr-2"></i>
            {isCreating ? 'Creating...' : 'Create Room'}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Input 
              type="text" 
              placeholder="Enter room code" 
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="flex-1 bg-card border border-border rounded-xl px-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              data-testid="input-room-code"
            />
            <Button 
              onClick={handleJoinRoom}
              disabled={isJoining}
              className="bg-accent text-accent-foreground px-6 py-4 rounded-xl font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-join-room"
            >
              {isJoining ? '...' : 'Join'}
            </Button>
          </div>
        </div>

        {/* Game Settings Preview */}
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Game Settings</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Players</span>
                <span className="text-foreground">4-8 people</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discussion Time</span>
                <span className="text-foreground">3 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Personality</span>
                <span className="text-foreground">Casual Gamer</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Non-intrusive ad space */}
        <div className="mt-6">
          <DemoAdBanner className="max-w-sm mx-auto" />
        </div>
      </div>
    </div>
  );
}
