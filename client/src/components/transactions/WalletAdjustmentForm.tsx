import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";

// Schema for wallet adjustment form
const adjustmentSchema = z.object({
  amount: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num !== 0;
  }, { message: "Amount must be a non-zero number" }),
  remarks: z.string().min(3, "Please provide a reason for this adjustment")
});

interface WalletAdjustmentFormProps {
  user: User;
  onSuccess?: () => void;
}

export default function WalletAdjustmentForm({ user, onSuccess }: WalletAdjustmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof adjustmentSchema>>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      amount: "",
      remarks: ""
    },
  });
  
  async function onSubmit(values: z.infer<typeof adjustmentSchema>) {
    setIsSubmitting(true);
    
    try {
      const amount = parseFloat(values.amount);
      
      const response = await apiRequest("POST", `/api/users/${user.id}/wallet`, {
        amount,
        remarks: values.remarks
      });
      
      // Refresh user data and transactions
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/transactions`] });
      
      const adjustmentType = amount > 0 ? "Addition" : "Deduction";
      
      toast({
        title: `Wallet ${adjustmentType} Successful`,
        description: `${Math.abs(amount)} has been ${amount > 0 ? "added to" : "deducted from"} ${user.name}'s wallet.`,
      });
      
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-background/50 p-4 rounded-lg mb-4">
          <p className="text-sm mb-2">User: <span className="font-semibold">{user.name}</span> ({user.username})</p>
          <p className="text-sm">Current Balance: <span className="font-mono font-semibold">{formatCurrency(user.walletBalance)}</span></p>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adjustment Amount (₹)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Enter positive value to add, negative to subtract" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks (Reason for adjustment)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide details about this wallet adjustment" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-amber hover:bg-amber/90 text-black"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Adjust Balance"}
          </Button>
        </div>
      </form>
    </Form>
  );
}