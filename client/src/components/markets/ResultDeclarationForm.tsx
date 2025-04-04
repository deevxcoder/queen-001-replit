import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Market, GameType } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";

// Schema for result declaration
const resultSchema = z.object({
  result: z.string().min(1, "Result is required"),
  oddEven: z.enum(["Odd", "Even"]),
  status: z.enum(["Final", "Provisional"])
});

interface ResultDeclarationFormProps {
  market: Market;
  onSuccess?: () => void;
}

export default function ResultDeclarationForm({ market, onSuccess }: ResultDeclarationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Dummy data for the design
  const stats = {
    totalBets: 143,
    bettingVolume: 12500,
    potentialPayout: 24750,
    estimatedProfit: 8250,
    winningDistribution: [
      { gameType: GameType.JODI, bets: 67, winCount: 2, payout: 12600 },
      { gameType: GameType.HURF, bets: 43, winCount: 5, payout: 4950 },
      { gameType: GameType.CROSS, bets: 29, winCount: 1, payout: 1350 },
      { gameType: GameType.ODD_EVEN, bets: 53, winCount: 26, payout: 5850 }
    ]
  };
  
  const form = useForm<z.infer<typeof resultSchema>>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      result: "",
      oddEven: "Odd",
      status: "Final"
    },
  });
  
  // Auto-calculate odd/even based on result input
  const resultValue = form.watch("result");
  if (resultValue && resultValue.length === 2) {
    const resultNum = parseInt(resultValue, 10);
    if (!isNaN(resultNum)) {
      const isOdd = resultNum % 2 !== 0;
      form.setValue("oddEven", isOdd ? "Odd" : "Even");
    }
  }
  
  async function onSubmit(values: z.infer<typeof resultSchema>) {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", `/api/markets/${market.id}/declare-result`, {
        result: values.result
      });
      
      toast({
        title: "Result declared",
        description: `Result for ${market.name} has been declared successfully`,
      });
      
      // Refresh market data
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/markets/${market.id}`] });
      
      // Call success callback
      if (onSuccess) onSuccess();
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to declare result",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
      <div>
        <h3 className="font-semibold mb-3">Result Details</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jodi Result (00-99)</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="9"
                      className="bg-background border border-[#2D2D2D] rounded-lg p-3 w-full text-center text-2xl font-mono"
                      placeholder="0"
                      value={field.value.length > 0 ? field.value[0] : ""}
                      onChange={(e) => {
                        const firstDigit = e.target.value.slice(-1);
                        const secondDigit = field.value.length > 1 ? field.value[1] : "";
                        field.onChange(firstDigit + secondDigit);
                      }}
                    />
                    <Input
                      type="number"
                      min="0"
                      max="9"
                      className="bg-background border border-[#2D2D2D] rounded-lg p-3 w-full text-center text-2xl font-mono"
                      placeholder="0"
                      value={field.value.length > 1 ? field.value[1] : ""}
                      onChange={(e) => {
                        const firstDigit = field.value.length > 0 ? field.value[0] : "";
                        const secondDigit = e.target.value.slice(-1);
                        field.onChange(firstDigit + secondDigit);
                      }}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="oddEven"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odd/Even Result</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background border border-[#2D2D2D]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Odd">Odd</SelectItem>
                        <SelectItem value="Even">Even</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background border border-[#2D2D2D]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Final">Final</SelectItem>
                        <SelectItem value="Provisional">Provisional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                className="bg-amber hover:bg-amber/90 text-black"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Results"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      
      <div>
        <h3 className="font-semibold mb-3">Betting Summary</h3>
        
        <div className="space-y-4">
          <div className="bg-background p-4 rounded-lg border border-[#2D2D2D]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Total Bets</span>
              <span className="font-semibold">{stats.totalBets}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Betting Volume</span>
              <span className="font-semibold font-mono">{formatCurrency(stats.bettingVolume)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Potential Payout</span>
              <span className="font-semibold font-mono text-red-500">{formatCurrency(stats.potentialPayout)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Estimated Profit</span>
              <span className="font-semibold font-mono text-green-500">{formatCurrency(stats.estimatedProfit)}</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-2">Winning Distribution</h4>
            <div className="bg-background rounded-lg overflow-hidden">
              <div className="flex items-center p-3 border-b border-[#2D2D2D]">
                <div className="w-1/4 text-sm">Game Type</div>
                <div className="w-1/4 text-sm text-center">Bets</div>
                <div className="w-1/4 text-sm text-center">Win Count</div>
                <div className="w-1/4 text-sm text-right">Payout</div>
              </div>
              
              <div className="divide-y divide-[#2D2D2D]">
                {stats.winningDistribution.map((item, index) => (
                  <div key={index} className="flex items-center p-3">
                    <div className="w-1/4 text-sm">{item.gameType.charAt(0) + item.gameType.slice(1).toLowerCase().replace('_', '-')}</div>
                    <div className="w-1/4 text-sm text-center">{item.bets}</div>
                    <div className="w-1/4 text-sm text-center">{item.winCount}</div>
                    <div className="w-1/4 text-sm text-right font-mono">{formatCurrency(item.payout)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
