import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GameType, Market, MarketGameType } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";

// Schema for hurf betting
const hurfBettingSchema = z.object({
  position: z.enum(["Left", "Right", "Both"]),
  digits: z.string().min(1, "Please select at least one digit")
    .refine(val => /^\d{1,2}$/.test(val), {
      message: "Please select valid digits (0-9 for Left/Right, 00-99 for Both)"
    }),
  amount: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: "Amount must be a positive number" }),
});

interface HurfBettingProps {
  market: Market;
  gameType: MarketGameType;
}

export default function HurfBetting({ market, gameType }: HurfBettingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof hurfBettingSchema>>({
    resolver: zodResolver(hurfBettingSchema),
    defaultValues: {
      position: "Left",
      digits: "",
      amount: "",
    },
  });
  
  const selectedPosition = form.watch("position");
  
  const handleDigitSelect = (digit: string) => {
    setSelectedDigit(digit);
    form.setValue("digits", digit);
  };
  
  const generateDigitButtons = () => {
    if (selectedPosition === "Both") {
      // For "Both", show a 10x10 grid for double-digit selection (similar to Jodi)
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
    } else {
      // For Left or Right, show a single row of digits 0-9
      return (
        <div className="flex space-x-2 mb-2">
          {Array.from({ length: 10 }, (_, i) => {
            const digit = i.toString();
            return (
              <button
                key={digit}
                type="button"
                className={`w-12 h-12 rounded-md font-mono text-center flex items-center justify-center text-lg
                  ${selectedDigit === digit 
                    ? "bg-amber text-black" 
                    : "bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white"
                  }`}
                onClick={() => handleDigitSelect(digit)}
              >
                {digit}
              </button>
            );
          })}
        </div>
      );
    }
  };
  
  // Calculate odds based on position - this would typically come from server
  const getOddsForPosition = () => {
    if (selectedPosition === "Both") {
      return gameType.odds * 8; // Higher odds for matching both positions
    }
    return gameType.odds;
  };
  
  const odds = getOddsForPosition();
  
  // Reset digit selection when position changes
  const handlePositionChange = (value: string) => {
    setSelectedDigit(null);
    form.setValue("digits", "");
    form.setValue("position", value as "Left" | "Right" | "Both");
  };
  
  async function onSubmit(values: z.infer<typeof hurfBettingSchema>) {
    setIsSubmitting(true);
    
    try {
      // Calculate potential winning
      const potentialWinning = parseFloat(values.amount) * odds;
      
      // Format selection
      const selection = `${values.position}: ${values.digits}`;
      
      const betData = {
        marketId: market.id,
        gameType: GameType.HURF,
        selection,
        amount: parseFloat(values.amount),
        potentialWinning
      };
      
      await apiRequest("POST", "/api/market-bets", betData);
      
      // Refresh user data to update wallet balance
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Bet placed successfully",
        description: `You bet ${formatCurrency(parseFloat(values.amount))} on ${selection}`,
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
      <h3 className="text-xl font-heading font-semibold mb-4">Hurf Game</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Select a position (left or right) and a digit. Win if your digit matches that position in the result.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Position</FormLabel>
                <div className="flex flex-wrap gap-4">
                  <RadioGroup 
                    onValueChange={handlePositionChange} 
                    defaultValue={field.value}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Left" id="left" />
                      <label htmlFor="left" className="cursor-pointer">Left Digit</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Right" id="right" />
                      <label htmlFor="right" className="cursor-pointer">Right Digit</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Both" id="both" />
                      <label htmlFor="both" className="cursor-pointer">Both Digits (Double Match)</label>
                    </div>
                  </RadioGroup>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <div className="mb-2 flex justify-between items-center">
              <FormLabel>Select {selectedPosition === "Both" ? "Digits" : "Digit"}</FormLabel>
              {selectedDigit && (
                <span className="text-sm font-mono bg-[#2D2D2D] px-2 py-1 rounded">
                  Selected: {selectedDigit}
                </span>
              )}
            </div>
            
            <div className="mb-4 overflow-x-auto">
              {generateDigitButtons()}
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
                  ? formatCurrency(parseFloat(form.watch("amount")) * odds)
                  : "₹0.00"
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Odds: x{odds} for {selectedPosition} position
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
