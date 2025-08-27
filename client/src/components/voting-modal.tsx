import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Player } from '@shared/schema';

interface VotingModalProps {
  players: Player[];
  onVote: (targetPlayerId: string) => void;
  onSkip: () => void;
  getPlayerColor: (playerId: string, isAI: boolean) => string;
  getPlayerInitial: (name: string) => string;
}

export function VotingModal({ players, onVote, onSkip, getPlayerColor, getPlayerInitial }: VotingModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  useState(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onSkip();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  });

  const handleVote = (playerId: string) => {
    setSelectedPlayer(playerId);
    setTimeout(() => {
      onVote(playerId);
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="modal-voting">
      <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-vote-yea text-primary-foreground text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Voting Time!</h2>
          <p className="text-sm text-muted-foreground">Who do you think is the AI imposter?</p>
          <div className="mt-2 text-xs text-muted-foreground">
            <i className="fas fa-clock mr-1"></i>
            <span data-testid="text-voting-time">{timeLeft} seconds remaining</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {players.map(player => (
            <button 
              key={player.id}
              onClick={() => handleVote(player.id)}
              disabled={selectedPlayer !== null}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                selectedPlayer === player.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:bg-muted'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              data-testid={`button-vote-${player.id}`}
            >
              <div className={`w-10 h-10 ${getPlayerColor(player.id, player.isAI)} rounded-full flex items-center justify-center`}>
                <span className="text-sm text-white font-medium">
                  {getPlayerInitial(player.name)}
                </span>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-foreground">{player.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedPlayer === player.id ? 'Selected!' : 'Click to vote'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedPlayer === player.id ? (
                  <i className="fas fa-check text-primary"></i>
                ) : (
                  <i className="fas fa-chevron-right"></i>
                )}
              </div>
            </button>
          ))}
        </div>

        <Button 
          onClick={onSkip}
          disabled={selectedPlayer !== null}
          className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-skip-vote"
        >
          Skip Vote
        </Button>
      </div>
    </div>
  );
}
