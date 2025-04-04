import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import OptionGameCard from "@/components/options/OptionGameCard";
import OptionGameForm from "@/components/options/OptionGameForm";
import { OptionGame } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminOptionGames() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedGame, setSelectedGame] = useState<OptionGame | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<number | "">("");
  const { toast } = useToast();
  
  // Fetch option games
  const { data: optionGames, isLoading } = useQuery<OptionGame[]>({
    queryKey: ["/api/option-games"],
  });
  
  const handleCreateGame = () => {
    setShowCreateDialog(true);
  };
  
  const handleEditGame = (game: OptionGame) => {
    setSelectedGame(game);
    setShowEditDialog(true);
  };
  
  const handleGameCreated = () => {
    setShowCreateDialog(false);
    queryClient.invalidateQueries({ queryKey: ["/api/option-games"] });
    toast({
      title: "Option game created",
      description: "The option game has been created successfully",
    });
  };
  
  const handleGameUpdated = () => {
    setShowEditDialog(false);
    queryClient.invalidateQueries({ queryKey: ["/api/option-games"] });
    toast({
      title: "Option game updated",
      description: "The option game has been updated successfully",
    });
  };
  
  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId === "" ? "" : parseInt(gameId));
  };
  
  // Filter games by ID if selected
  const filteredGames = selectedGameId === "" 
    ? optionGames 
    : optionGames?.filter(game => game.id === selectedGameId);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">Option Games Management</h1>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-amber hover:bg-amber/90 text-black" onClick={handleCreateGame}>
              <Plus className="mr-2 h-4 w-4" />
              Create Option Game
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Option Game</DialogTitle>
              <DialogDescription>
                Add a new team vs team option game to your betting platform.
              </DialogDescription>
            </DialogHeader>
            <OptionGameForm onSuccess={handleGameCreated} />
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="bets">Bets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="games" className="space-y-4">
          <div className="mb-4">
            <Select value={selectedGameId.toString()} onValueChange={handleSelectGame}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Filter by game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Games</SelectItem>
                {optionGames?.map((game) => (
                  <SelectItem key={game.id} value={game.id.toString()}>
                    {game.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin w-8 h-8 border-4 border-amber rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGames && filteredGames.length > 0 ? (
                filteredGames.map((game) => (
                  <OptionGameCard 
                    key={game.id} 
                    optionGame={game} 
                    isAdmin={true}
                    onEdit={handleEditGame}
                  />
                ))
              ) : (
                <div className="col-span-full py-10 text-center">
                  <p className="text-muted-foreground">
                    {selectedGameId === "" 
                      ? "No option games found. Create your first option game!" 
                      : "No option game found with the selected ID."
                    }
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Edit Game Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Option Game</DialogTitle>
                <DialogDescription>
                  Update the details of the selected option game.
                </DialogDescription>
              </DialogHeader>
              {selectedGame && (
                <OptionGameForm 
                  optionGame={selectedGame}
                  onSuccess={handleGameUpdated}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="bets" className="space-y-4">
          <div className="mb-4">
            <Select value={selectedGameId.toString()} onValueChange={handleSelectGame}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Filter by game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Games</SelectItem>
                {optionGames?.map((game) => (
                  <SelectItem key={game.id} value={game.id.toString()}>
                    {game.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* We will use a simplified version similar to RecentBetsTable */}
          <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D] p-8 text-center">
            <p className="text-muted-foreground">
              Option game bets will be displayed here. Filter by selecting a specific game.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
