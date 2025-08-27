import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Message, Player } from '@shared/schema';

interface ChatContainerProps {
  messages: Message[];
  players: Player[];
  currentPlayer: Player | null;
  onSendMessage: (content: string) => void;
  getPlayerColor: (playerId: string, isAI: boolean) => string;
  getPlayerInitial: (name: string) => string;
}

export function ChatContainer({ 
  messages, 
  players, 
  currentPlayer, 
  onSendMessage, 
  getPlayerColor, 
  getPlayerInitial 
}: ChatContainerProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex-1 overflow-hidden bg-background">
      <div className="h-full flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chat-messages">
          
          {/* System Message */}
          <div className="flex justify-center">
            <div className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground">
              <i className="fas fa-info-circle mr-1"></i>
              Discussion phase started. Find the AI imposter!
            </div>
          </div>

          {/* Messages */}
          {messages.map((message) => {
            const player = players.find(p => p.id === message.playerId);
            if (!player) return null;

            return (
              <div key={message.id} className="chat-bubble" data-testid={`message-${message.id}`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 ${getPlayerColor(player.id, player.isAI)} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-sm text-white font-medium">
                      {getPlayerInitial(player.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-sm font-medium text-foreground" data-testid={`text-sender-${message.id}`}>
                        {player.name}
                      </span>
                      <span className="text-xs text-muted-foreground" data-testid={`text-timestamp-${message.id}`}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-foreground" data-testid={`text-content-${message.id}`}>
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-border p-4 bg-card">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Type your message..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  data-testid="input-chat-message"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <i className="fas fa-smile text-sm"></i>
                </button>
              </div>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-send-message"
            >
              <i className="fas fa-paper-plane text-sm"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
