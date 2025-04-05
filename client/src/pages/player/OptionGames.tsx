import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { OptionGame, MarketStatus } from "@shared/schema";
import OptionBetting from "@/components/betting/OptionBetting";
import { Clock, CalendarDays } from "lucide-react";

export default function PlayerOptionGames() {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  
  // Fetch option games
  const { data: optionGames, isLoading } = useQuery<OptionGame[]>({
    queryKey: ["/api/option-games"],
  });
  
  // Find the selected game
  const selectedGame = selectedGameId 
    ? optionGames?.find(game => game.id === selectedGameId) 
    : null;
  
  // Get only active games
  const activeGames = optionGames?.filter(game => game.status === MarketStatus.OPEN) || [];
  
  // Handle game selection
  const handleGameChange = (gameId: string) => {
    const id = parseInt(gameId);
    setSelectedGameId(id);
  };
  
  // Format time for display
  const formatTime = (dateInput: string | Date | undefined) => {
    if (!dateInput) return "";
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date for display
  const formatDate = (dateInput: string | Date | undefined) => {
    if (!dateInput) return "";
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Option Games</h1>
        <p className="text-muted-foreground">Place bets on team-based option games with variable payout systems</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Game</CardTitle>
              <CardDescription>Choose an active option game to play</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-amber rounded-full border-t-transparent"></div>
                </div>
              ) : activeGames.length > 0 ? (
                <div className="space-y-2">
                  <Select value={selectedGameId?.toString()} onValueChange={handleGameChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option game" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeGames.map(game => (
                        <SelectItem key={game.id} value={game.id.toString()}>
                          {game.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedGame && (
                    <div className="mt-4 p-4 bg-[#1E1E1E] rounded-lg">
                      <h3 className="font-semibold mb-2">{selectedGame.title}</h3>
                      <div className="text-sm space-y-2">
                        <div className="flex flex-col mt-2">
                          <div className="flex space-x-2 mb-1">
                            <Badge className="bg-blue-600">Team A</Badge>
                            <span>{selectedGame.teamA}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className="bg-red-600">Team B</Badge>
                            <span>{selectedGame.teamB}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 mt-2">
                          <Clock className="h-4 w-4 text-amber" />
                          <span className="text-muted-foreground">
                            Closes: {formatTime(selectedGame?.closingTime)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CalendarDays className="h-4 w-4 text-amber" />
                          <span className="text-muted-foreground">
                            {formatDate(selectedGame?.closingTime)}
                          </span>
                        </div>
                        <div className="mt-3">
                          <span className="text-xs py-1 px-2 bg-green-600 text-white rounded-full">
                            Open for Betting
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No active option games available at the moment
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {selectedGame ? (
            <OptionBetting optionGame={selectedGame} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Start Betting</CardTitle>
                <CardDescription>
                  Select an option game from the left panel to start betting
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[300px] flex flex-col items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="bg-[#1E1E1E] text-amber p-4 rounded-lg mb-4 max-w-md mx-auto">
                    <h3 className="font-semibold mb-2">Option Games</h3>
                    <p className="text-sm text-left">
                      Option games are team vs team betting events where you predict which side will win. 
                      Simply select your preferred team and place your bet. The odds are displayed for each game, 
                      showing your potential winnings based on your bet amount.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>My Recent Bets</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Here we would display recent bets for the user - this would be implementation in a real app */}
            <div className="text-center py-6 text-muted-foreground">
              Your recent option game betting history will appear here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}