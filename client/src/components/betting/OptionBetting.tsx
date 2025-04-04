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
import { OptionGame } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";

// Schema for option game betting
const optionBettingSchema = z.object({
  selection: z.enum(["A", "B"]),
  amount: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: "Amount must be a positive number" }),
});

interface OptionBettingProps {
  optionGame: OptionGame;
}

export default function OptionBetting({ optionGame }: OptionBettingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof optionBettingSchema>>({
    resolver: zodResolver(optionBettingSchema),
    defaultValues: {
      selection: "A",
      amount: "",
    },
  });
  
  async function onSubmit(values: z.infer<typeof optionBettingSchema>) {
    setIsSubmitting(true);
    
    try {
      // Calculate potential winning
      const potentialWinning = parseFloat(values.amount) * optionGame.odds;
      
      const betData = {
        optionGameId: optionGame.id,
        selection: values.selection,
        amount: parseFloat(values.amount),
        potentialWinning
      };
      
      await apiRequest("POST", "/api/option-bets", betData);
      
      // Refresh user data to update wallet balance
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      const teamName = values.selection === "A" ? optionGame.teamA : optionGame.teamB;
      
      toast({
        title: "Bet placed successfully",
        description: `You bet ${formatCurrency(parseFloat(values.amount))} on ${teamName} (Team ${values.selection})`,
      });
      
      // Reset form
      form.reset({ selection: "A", amount: "" });
      
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
      <h3 className="text-xl font-heading font-semibold mb-4">{optionGame.title}</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Choose the team you think will win. Bet on either {optionGame.teamA} or {optionGame.teamB}.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="selection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Your Team</FormLabel>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={`min-h-20 py-2 flex flex-col items-center justify-center ${field.value === 'A' ? 'bg-amber text-black border-amber' : ''}`}
                    onClick={() => field.onChange('A')}
                  >
                    <span className="text-lg font-bold">{optionGame.teamA}</span>
                    <span className="text-xs">Team A</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`min-h-20 py-2 flex flex-col items-center justify-center ${field.value === 'B' ? 'bg-amber text-black border-amber' : ''}`}
                    onClick={() => field.onChange('B')}
                  >
                    <span className="text-lg font-bold">{optionGame.teamB}</span>
                    <span className="text-xs">Team B</span>
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
                  ? formatCurrency(parseFloat(form.watch("amount")) * optionGame.odds)
                  : "₹0.00"
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Odds: x{optionGame.odds.toFixed(1)}
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
