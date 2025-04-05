import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TransactionType } from "@shared/schema";

// Schema for transaction form
const transactionSchema = z.object({
  type: z.enum([TransactionType.DEPOSIT, TransactionType.WITHDRAWAL]),
  amount: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: "Amount must be a positive number" }),
  reference: z.string().optional(),
  remarks: z.string().optional(),
});

interface TransactionFormProps {
  isDeposit?: boolean;
  onSuccess?: () => void;
}

export default function TransactionForm({ isDeposit = true, onSuccess }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: isDeposit ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
      amount: "",
      reference: "",
      remarks: "",
    },
  });
  
  async function onSubmit(values: z.infer<typeof transactionSchema>) {
    setIsSubmitting(true);
    
    try {
      // Prepare data - ensure all required fields are present
      const amount = parseFloat(values.amount);
      const transactionData = {
        type: values.type,
        amount: amount,
        reference: values.reference || "",
        remarks: values.remarks || "",
        status: "pending" // Explicitly set the status to ensure it's included
      };
      
      console.log("Submitting transaction:", transactionData);
      
      const response = await apiRequest("POST", "/api/transactions", transactionData);
      
      // Refresh transactions
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }); // To update wallet balance
      queryClient.invalidateQueries({ queryKey: [`/api/users/${(response as any).userId}/transactions`] });
      
      toast({
        title: isDeposit ? "Deposit requested" : "Withdrawal requested",
        description: isDeposit 
          ? "Your deposit request has been submitted and is pending approval." 
          : "Your withdrawal request has been submitted and is pending approval.",
      });
      
      // Call success callback
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Transaction error:", error);
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
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={TransactionType.DEPOSIT}>Deposit</SelectItem>
                  <SelectItem value={TransactionType.WITHDRAWAL}>Withdrawal</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₹)</FormLabel>
              <FormControl>
                <Input type="number" min="1" step="1" placeholder="1000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {isDeposit && (
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Reference / UTR Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter payment reference or UTR number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={isDeposit 
                    ? "Any additional information about your deposit" 
                    : "Any additional information about your withdrawal"
                  } 
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
            {isSubmitting ? 
              (isDeposit ? "Requesting Deposit..." : "Requesting Withdrawal...") : 
              (isDeposit ? "Request Deposit" : "Request Withdrawal")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
