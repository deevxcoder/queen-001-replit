import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Market, MarketBet, MarketGameType, GameType } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";

// Create schema for result declaration
const resultFormSchema = z.object({
  resultValue: z.string().min(1, "Result value is required"),
});

type MarketResultFormProps = {
  market: Market;
  onSuccess?: () => void;
};

export default function MarketResultForm({ market, onSuccess }: MarketResultFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameTypes, setGameTypes] = useState<MarketGameType[]>([]);
  const [bets, setBets] = useState<MarketBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [potentialWinnings, setPotentialWinnings] = useState(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof resultFormSchema>>({
    resolver: zodResolver(resultFormSchema),
    defaultValues: {
      resultValue: market.resultValue || "",
    },
  });

  const resultValue = form.watch("resultValue");
  
  // Fetch game types and bets for this market
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch game types
        const gameTypesResponse = await apiRequest("GET", `/api/markets/${market.id}/game-types`);
        const gameTypesData = await gameTypesResponse.json();
        setGameTypes(gameTypesData);
        
        // Fetch bets
        const betsResponse = await apiRequest("GET", `/api/markets/${market.id}/bets`);
        const betsData = await betsResponse.json();
        setBets(betsData);
      } catch (error) {
        console.error("Error fetching market data:", error);
        toast({
          title: "Error",
          description: "Failed to load market data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [market.id, toast]);
  
  // Calculate potential winnings based on the result value
  useEffect(() => {
    if (!resultValue || !bets.length || !gameTypes.length) {
      setPotentialWinnings(0);
      return;
    }
    
    // Calculate winning amount based on game types and bets
    let totalWinnings = 0;
    
    bets.forEach(bet => {
      const gameType = gameTypes.find(gt => gt.gameType === bet.gameType);
      if (!gameType) return;
      
      let isWinning = false;
      
      switch (bet.gameType) {
        case GameType.JODI:
          // Exact match on two digits
          isWinning = bet.selection === resultValue;
          break;
        case GameType.HURF:
          // Position-based match (e.g., "1-5" means position 1 is number 5)
          const [position, digit] = bet.selection.split("-");
          const positionIndex = parseInt(position);
          if (!isNaN(positionIndex) && positionIndex >= 0 && positionIndex < resultValue.length) {
            isWinning = resultValue[positionIndex] === digit;
          }
          break;
        case GameType.CROSS:
          // Any position match
          isWinning = resultValue.includes(bet.selection);
          break;
        case GameType.ODD_EVEN:
          // Odd or even result
          const resultNum = parseInt(resultValue);
          if (!isNaN(resultNum)) {
            const isOdd = resultNum % 2 !== 0;
            isWinning = (bet.selection === "odd" && isOdd) || (bet.selection === "even" && !isOdd);
          }
          break;
      }
      
      if (isWinning) {
        totalWinnings += bet.potentialWinning;
      }
    });
    
    setPotentialWinnings(totalWinnings);
  }, [resultValue, bets, gameTypes]);

  async function onSubmit(values: z.infer<typeof resultFormSchema>) {
    setIsSubmitting(true);
    
    try {
      // Declare the result
      await apiRequest("POST", `/api/markets/${market.id}/declare-result`, {
        resultValue: values.resultValue
      });
      
      toast({
        title: "Result declared",
        description: "Market result has been declared successfully",
      });
      
      // Refresh market data
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      
      // Call success callback
      if (onSuccess) onSuccess();
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="resultValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Result Value</FormLabel>
                <FormControl>
                  <Input placeholder="Enter result (e.g. 45)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold">Active Bets Summary</h3>
                <span className="text-sm">{bets.length} active bets</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Bet Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(bets.reduce((sum, bet) => sum + bet.amount, 0))}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Potential Payout:</span>
                  <span className="font-medium text-amber">
                    {formatCurrency(potentialWinnings)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full bg-amber hover:bg-amber/90 text-black"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? "Declaring Result..." : "Declare Result"}
            </Button>
            <p className="text-xs text-center mt-2 text-muted-foreground">
              This action will process all bets and award winnings automatically.
            </p>
          </div>
        </form>
      </Form>
      
      {bets.length > 0 && (
        <div className="border rounded-md p-4">
          <h3 className="text-sm font-semibold mb-3">Detailed Bet Breakdown</h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
            {bets.map((bet) => {
              const gameType = gameTypes.find(gt => gt.gameType === bet.gameType);
              const odds = gameType?.odds || 0;
              
              return (
                <div key={bet.id} className="bg-card p-2 rounded-md text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{bet.gameType}</span>
                    <span>{formatCurrency(bet.amount)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Selection: {bet.selection}</span>
                    <span>Payout: {formatCurrency(bet.potentialWinning)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}