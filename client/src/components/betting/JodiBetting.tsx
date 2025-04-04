import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GameType, Market, MarketGameType } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";

// Schema for jodi betting
const jodiBettingSchema = z.object({
  digits: z.string()
    .regex(/^\d{2}$/, "Please select a two-digit number (00-99)")
    .transform(val => val),
  amount: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: "Amount must be a positive number" }),
});

interface JodiBettingProps {
  market: Market;
  gameType: MarketGameType;
}

export default function JodiBetting({ market, gameType }: JodiBettingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof jodiBettingSchema>>({
    resolver: zodResolver(jodiBettingSchema),
    defaultValues: {
      digits: "",
      amount: "",
    },
  });
  
  const handleDigitSelect = (digit: string) => {
    setSelectedDigit(digit);
    form.setValue("digits", digit);
  };
  
  const generateNumberGrid = () => {
    const grid = [];
    for (let i = 0; i < 10; i++) {
      const row = [];
      for (let j = 0; j < 10; j++) {
        const digit = `${i}${j}`;
        row.push(
          <button
            key={digit}
            type="button"
            className={`w-10 h-10 rounded-md font-mono text-center flex items-center justify-center
              ${selectedDigit === digit 
                ? "bg-amber text-black" 
                : "bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white"
              }`}
            onClick={() => handleDigitSelect(digit)}
          >
            {digit}
          </button>
        );
      }
      grid.push(
        <div key={i} className="flex space-x-2 mb-2">
          {row}
        </div>
      );
    }
    return grid;
  };
  
  async function onSubmit(values: z.infer<typeof jodiBettingSchema>) {
    setIsSubmitting(true);
    
    try {
      // Calculate potential winning
      const potentialWinning = parseFloat(values.amount) * gameType.odds;
      
      const betData = {
        marketId: market.id,
        gameType: GameType.JODI,
        selection: values.digits,
        amount: parseFloat(values.amount),
        potentialWinning
      };
      
      await apiRequest("POST", "/api/market-bets", betData);
      
      // Refresh user data to update wallet balance
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Bet placed successfully",
        description: `You bet ${formatCurrency(parseFloat(values.amount))} on ${values.digits}`,
      });
      
      // Reset form
      form.reset();
      setSelectedDigit(null);
      
    } catch (error) {
      toast({
        title: "Error placing bet",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="bg-[#1E1E1E] rounded-xl border border-[#2D2D2D] p-6">
      <h3 className="text-xl font-heading font-semibold mb-4">Jodi Game</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Select any two-digit number between 00 and 99. Win if your number matches the result.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <div className="mb-2 flex justify-between items-center">
              <FormLabel>Select Number (00-99)</FormLabel>
              {selectedDigit && (
                <span className="text-sm font-mono bg-[#2D2D2D] px-2 py-1 rounded">
                  Selected: {selectedDigit}
                </span>
              )}
            </div>
            
            <div className="mb-4">
              {generateNumberGrid()}
            </div>
            
            <FormField
              control={form.control}
              name="digits"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bet Amount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" step="1" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Potential Winning</FormLabel>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-foreground flex items-center font-mono">
                {form.watch("amount") && !isNaN(parseFloat(form.watch("amount")))
                  ? formatCurrency(parseFloat(form.watch("amount")) * gameType.odds)
                  : "₹0.00"
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Odds: x{gameType.odds}
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-amber hover:bg-amber/90 text-black"
            disabled={isSubmitting || !selectedDigit}
          >
            {isSubmitting ? "Placing Bet..." : "Place Bet"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
