import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GameType, Market, MarketGameType } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";

// Schema for cross betting
const crossBettingSchema = z.object({
  digits: z.string().min(1, "Please select at least one digit"),
  amount: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: "Amount must be a positive number" }),
});

interface CrossBettingProps {
  market: Market;
  gameType: MarketGameType;
}

export default function CrossBetting({ market, gameType }: CrossBettingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [selectedDigits, setSelectedDigits] = useState<string[]>([]);
  const [permutations, setPermutations] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof crossBettingSchema>>({
    resolver: zodResolver(crossBettingSchema),
    defaultValues: {
      digits: "",
      amount: "",
    },
  });
  
  // Generate permutations from selected digits
  const generatePermutations = (digits: string[]) => {
    const perms: string[] = [];
    
    for (let i = 0; i < digits.length; i++) {
      for (let j = 0; j < digits.length; j++) {
        if (i !== j) {
          perms.push(digits[i] + digits[j]);
        }
      }
    }
    
    return perms;
  };
  
  const handleDigitToggle = (digit: string) => {
    let newSelection: string[];
    
    if (selectedDigits.includes(digit)) {
      // Remove digit
      newSelection = selectedDigits.filter(d => d !== digit);
    } else {
      // Add digit if less than 4 digits are selected
      if (selectedDigits.length >= 4) {
        toast({
          title: "Maximum 4 digits",
          description: "You can select up to 4 digits",
          variant: "destructive",
        });
        return;
      }
      newSelection = [...selectedDigits, digit];
    }
    
    // Update selected digits
    setSelectedDigits(newSelection);
    
    // Update permutations
    const newPermutations = generatePermutations(newSelection);
    setPermutations(newPermutations);
    
    // Update form value
    form.setValue("digits", newSelection.join(","));
  };
  
  // Calculate odds based on number of selected digits
  const getOddsForSelectionCount = () => {
    const count = selectedDigits.length;
    if (count === 2) return gameType.odds;      // Base odds for 2 digits (2 permutations)
    if (count === 3) return gameType.odds / 3;  // Lower odds for 3 digits (6 permutations)
    if (count === 4) return gameType.odds / 6;  // Lowest odds for 4 digits (12 permutations)
    return 0; // No selection
  };
  
  const odds = getOddsForSelectionCount();
  
  async function onSubmit(values: z.infer<typeof crossBettingSchema>) {
    setIsSubmitting(true);
    
    try {
      // Calculate potential winning
      const potentialWinning = parseFloat(values.amount) * odds;
      
      const betData = {
        marketId: market.id,
        gameType: GameType.CROSS,
        selection: values.digits,
        amount: parseFloat(values.amount),
        potentialWinning
      };
      
      await apiRequest("POST", "/api/market-bets", betData);
      
      // Refresh user data to update wallet balance
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Bet placed successfully",
        description: `You bet ${formatCurrency(parseFloat(values.amount))} on Cross with digits ${values.digits}`,
      });
      
      // Reset form
      form.reset();
      setSelectedDigits([]);
      setPermutations([]);
      
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
      <h3 className="text-xl font-heading font-semibold mb-4">Cross Game</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Select multiple digits (2-4). Win if any of the permutations match the result. More digits mean more chances but lower odds.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <div className="mb-2 flex justify-between items-center">
              <FormLabel>Select Digits (2-4)</FormLabel>
              {selectedDigits.length > 0 && (
                <span className="text-sm font-mono bg-[#2D2D2D] px-2 py-1 rounded">
                  Selected: {selectedDigits.join(", ")}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-5 gap-3 mb-4">
              {Array.from({ length: 10 }, (_, i) => {
                const digit = i.toString();
                return (
                  <div key={digit} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`digit-${digit}`} 
                      checked={selectedDigits.includes(digit)}
                      onCheckedChange={() => handleDigitToggle(digit)}
                      className="bg-[#2D2D2D] data-[state=checked]:bg-amber data-[state=checked]:text-black"
                    />
                    <label 
                      htmlFor={`digit-${digit}`}
                      className="text-lg font-mono cursor-pointer"
                    >
                      {digit}
                    </label>
                  </div>
                );
              })}
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
          
          {permutations.length > 0 && (
            <div className="bg-[#2D2D2D] p-3 rounded-lg">
              <p className="text-sm mb-2">Permutations ({permutations.length}):</p>
              <div className="flex flex-wrap gap-2">
                {permutations.map((perm, index) => (
                  <span 
                    key={index}
                    className="bg-background px-2 py-1 rounded font-mono text-sm"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}
          
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
                {form.watch("amount") && !isNaN(parseFloat(form.watch("amount"))) && selectedDigits.length >= 2
                  ? formatCurrency(parseFloat(form.watch("amount")) * odds)
                  : "₹0.00"
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedDigits.length >= 2 
                  ? `Odds: x${odds.toFixed(1)} for ${selectedDigits.length} digits (${permutations.length} permutations)`
                  : "Select at least 2 digits"
                }
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-amber hover:bg-amber/90 text-black"
            disabled={isSubmitting || selectedDigits.length < 2}
          >
            {isSubmitting ? "Placing Bet..." : "Place Bet"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
