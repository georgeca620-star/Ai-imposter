import { Button } from '@/components/ui/button';
import type { Player } from '@shared/schema';
import { DemoAdBanner } from '@/components/ad-banner';

interface GameResultsModalProps {
  results: {
    aiWins: boolean;
    aiPlayer: Player;
    voteResults: Array<{ player: Player; votes: number }>;
  };
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  getPlayerInitial: (name: string) => string;
}

export function GameResultsModal({ results, onPlayAgain, onReturnToLobby, getPlayerInitial }: GameResultsModalProps) {
  const { aiWins, aiPlayer, voteResults } = results;

  const handleShare = () => {
    const text = `Just played AI Imposter! The AI ${aiWins ? 'won' : 'was caught'}! Can you spot the AI among humans?`;
    if (navigator.share) {
      navigator.share({ text, url: window.location.origin });
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.origin}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="modal-game-results">
      <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
        <div className="text-center">
          <div className="mb-6">
            <div className={`w-20 h-20 ${aiWins ? 'ai-indicator' : 'bg-accent'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <i className={`fas ${aiWins ? 'fa-robot' : 'fa-users'} text-white text-2xl`}></i>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-game-result">
              {aiWins ? 'AI Wins!' : 'Humans Win!'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {aiWins ? 'The imposter successfully blended in' : 'The AI was caught!'}
            </p>
            
            {/* AI Reveal */}
            <div className="bg-muted rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-12 h-12 ai-indicator rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {getPlayerInitial(aiPlayer.name)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-foreground" data-testid="text-ai-player-name">
                    {aiPlayer.name}
                  </div>
                  <div className="text-xs text-muted-foreground">AI Imposter</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground italic">
                "I tried to blend in as a casual player. Did I fool you?"
              </div>
            </div>

            {/* Vote Results */}
            <div className="bg-background rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Vote Results</h3>
              <div className="space-y-2 text-sm">
                {voteResults.map(({ player, votes }) => (
                  <div key={player.id} className="flex justify-between" data-testid={`vote-result-${player.id}`}>
                    <span className={`text-muted-foreground ${player.isAI ? 'font-medium' : ''}`}>
                      {player.name} {player.isAI ? '(AI)' : ''}
                    </span>
                    <span className="text-foreground">{votes} vote{votes !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ad between results and action buttons */}
          <div className="my-4">
            <DemoAdBanner />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onPlayAgain}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-play-again"
            >
              <i className="fas fa-redo mr-2"></i>
              Play Again
            </Button>
            
            <Button 
              onClick={handleShare}
              className="w-full bg-accent text-accent-foreground py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors"
              data-testid="button-share-results"
            >
              <i className="fas fa-share mr-2"></i>
              Share Results
            </Button>
            
            <Button 
              onClick={onReturnToLobby}
              className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              data-testid="button-return-lobby"
            >
              Return to Lobby
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
