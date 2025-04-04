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

// Schema for odd-even betting
const oddEvenBettingSchema = z.object({
  selection: z.enum(["Odd", "Even"]),
  amount: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: "Amount must be a positive number" }),
});

interface OddEvenBettingProps {
  market: Market;
  gameType: MarketGameType;
}

export default function OddEvenBetting({ market, gameType }: OddEvenBettingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof oddEvenBettingSchema>>({
    resolver: zodResolver(oddEvenBettingSchema),
    defaultValues: {
      selection: "Odd",
      amount: "",
    },
  });
  
  async function onSubmit(values: z.infer<typeof oddEvenBettingSchema>) {
    setIsSubmitting(true);
    
    try {
      // Calculate potential winning
      const potentialWinning = parseFloat(values.amount) * gameType.odds;
      
      const betData = {
        marketId: market.id,
        gameType: GameType.ODD_EVEN,
        selection: values.selection,
        amount: parseFloat(values.amount),
        potentialWinning
      };
      
      await apiRequest("POST", "/api/market-bets", betData);
      
      // Refresh user data to update wallet balance
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Bet placed successfully",
        description: `You bet ${formatCurrency(parseFloat(values.amount))} on ${values.selection}`,
      });
      
      // Reset form
      form.reset({ selection: "Odd", amount: "" });
      
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
      <h3 className="text-xl font-heading font-semibold mb-4">Odd-Even Game</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Bet on whether the result will be an odd or even number. Simple 50/50 odds.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="selection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Your Prediction</FormLabel>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-20 text-xl ${field.value === 'Odd' ? 'bg-amber text-black border-amber' : ''}`}
                    onClick={() => field.onChange('Odd')}
                  >
                    ODD
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-20 text-xl ${field.value === 'Even' ? 'bg-amber text-black border-amber' : ''}`}
                    onClick={() => field.onChange('Even')}
                  >
                    EVEN
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
                Odds: x{gameType.odds.toFixed(1)}
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-amber hover:bg-amber/90 text-black"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Placing Bet..." : "Place Bet"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
