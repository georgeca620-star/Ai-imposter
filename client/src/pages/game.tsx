import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ChatContainer } from '@/components/chat-container';
import { VotingModal } from '@/components/voting-modal';
import { GameResultsModal } from '@/components/game-results-modal';
import { DemoAdBanner } from '@/components/ad-banner';
import type { Game, Player, Message } from '@shared/schema';

export default function GamePage() {
  const [match, params] = useRoute('/game/:gameId');
  const gameId = params?.gameId || null;
  
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showVoting, setShowVoting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [gameResults, setGameResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const { toast } = useToast();

  // Load current player from localStorage
  useEffect(() => {
    const storedPlayer = localStorage.getItem('currentPlayer');
    if (storedPlayer) {
      setCurrentPlayer(JSON.parse(storedPlayer));
    }
  }, []);

  const { connected, sendMessage, lastMessage } = useWebSocket(
    gameId,
    currentPlayer?.id || null
  );

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'gameState':
        setGame(lastMessage.game);
        setPlayers(lastMessage.players);
        setMessages(lastMessage.messages);
        break;
        
      case 'message':
        setMessages(prev => [...prev, lastMessage.message]);
        break;
        
      case 'gamePhaseChanged':
        setGame(lastMessage.game);
        if (lastMessage.game.status === 'voting') {
          setShowVoting(true);
        }
        break;
        
      case 'gameEnded':
        setGameResults(lastMessage.results);
        setShowResults(true);
        setShowVoting(false);
        break;
    }
  }, [lastMessage]);

  // Timer for discussion/voting phase
  useEffect(() => {
    if (!game) return;

    const timer = setInterval(() => {
      let endTime: Date | null = null;
      
      if (game.status === 'discussion' && game.discussionTimeLeft) {
        endTime = new Date(game.discussionTimeLeft);
      } else if (game.status === 'voting' && game.votingTimeLeft) {
        endTime = new Date(game.votingTimeLeft);
      }

      if (endTime) {
        const now = new Date();
        const diff = endTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          if (game.status === 'discussion') {
            setTimeLeft('Voting time!');
            setShowVoting(true);
          } else {
            setTimeLeft('Time up!');
          }
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')} remaining`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [game]);

  const handleStartGame = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/start`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: "Game Started!",
        description: "Discussion phase begins now"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start game",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = (content: string) => {
    sendMessage({
      type: 'sendMessage',
      content
    });
  };

  const handleVote = (targetPlayerId: string) => {
    sendMessage({
      type: 'vote',
      targetPlayerId
    });
    setShowVoting(false);
  };

  const getPlayerInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getPlayerColor = (playerId: string, isAI: boolean) => {
    if (isAI) return 'ai-indicator';
    
    const colors = ['bg-primary', 'bg-accent', 'bg-destructive', 'bg-orange-500', 'bg-purple-500', 'bg-green-500'];
    const index = playerId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (!match) {
    return <div>Game not found</div>;
  }

  if (!connected) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Connecting to game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-mask text-primary-foreground text-sm"></i>
          </div>
          <h1 className="text-xl font-bold text-foreground">AI Imposter</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-muted-foreground">
            <span data-testid="text-player-name">{currentPlayer?.name}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Game State Indicator */}
        <div className="bg-card px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${game?.status === 'lobby' ? 'bg-yellow-500' : 'bg-accent'} pulse-glow`}></div>
              <span className="text-sm font-medium text-accent uppercase" data-testid="text-game-phase">
                {game?.status === 'lobby' ? 'WAITING' : 
                 game?.status === 'discussion' ? 'DISCUSSION PHASE' :
                 game?.status === 'voting' ? 'VOTING PHASE' : 'GAME ENDED'}
              </span>
              <span className="text-xs text-muted-foreground" data-testid="text-time-left">
                {timeLeft}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Room:</span>
              <span className="text-sm font-mono text-foreground" data-testid="text-room-code">
                {game?.roomCode}
              </span>
              <button 
                className="text-xs text-primary hover:text-primary/80"
                onClick={() => navigator.clipboard.writeText(game?.roomCode || '')}
                data-testid="button-copy-room-code"
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="bg-secondary px-4 py-2 border-b border-border">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Players:</span>
            {players.map(player => (
              <div key={player.id} className="flex items-center space-x-1 bg-muted rounded-full px-2 py-1 whitespace-nowrap" data-testid={`player-${player.id}`}>
                <div className={`w-4 h-4 ${getPlayerColor(player.id, player.isAI)} rounded-full flex items-center justify-center`}>
                  <span className="text-xs text-white font-medium">
                    {getPlayerInitial(player.name)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{player.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Content */}
        {game?.status === 'lobby' ? (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-4">Waiting for Players</h2>
              <p className="text-muted-foreground mb-8">
                Need at least 4 players to start. Current: {players.length}
              </p>
              
              {/* Small ad while waiting */}
              <div className="mb-8">
                <DemoAdBanner />
              </div>
              
              {players.length >= 4 && game.createdBy === currentPlayer?.name && (
                <Button 
                  onClick={handleStartGame}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90"
                  data-testid="button-start-game"
                >
                  Start Game
                </Button>
              )}
            </div>
          </div>
        ) : (
          <ChatContainer 
            messages={messages}
            players={players}
            currentPlayer={currentPlayer}
            onSendMessage={handleSendMessage}
            getPlayerColor={getPlayerColor}
            getPlayerInitial={getPlayerInitial}
          />
        )}
      </div>

      {/* Modals */}
      {showVoting && (
        <VotingModal 
          players={players.filter(p => p.id !== currentPlayer?.id)}
          onVote={handleVote}
          onSkip={() => handleVote('')}
          getPlayerColor={getPlayerColor}
          getPlayerInitial={getPlayerInitial}
        />
      )}

      {showResults && gameResults && (
        <GameResultsModal 
          results={gameResults}
          onPlayAgain={() => window.location.reload()}
          onReturnToLobby={() => window.location.href = '/'}
          getPlayerInitial={getPlayerInitial}
        />
      )}
    </div>
  );
}
