import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, add, set } from "date-fns";
import { cn } from "@/lib/utils";
import { Market, GameType } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

// Create schema for the market form
const marketFormSchema = z.object({
  name: z.string().min(3, "Market name must be at least 3 characters"),
  bannerImage: z.string().optional(),
  openingDate: z.date({
    required_error: "Opening date is required",
  }),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  closingDate: z.date({
    required_error: "Closing date is required",
  }),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  
  // Game types
  enableJodi: z.boolean().default(false),
  jodiOdds: z.number().min(1, "Odds must be at least 1").default(90),
  
  enableHurf: z.boolean().default(false),
  hurfOdds: z.number().min(1, "Odds must be at least 1").default(9),
  
  enableCross: z.boolean().default(false),
  crossOdds: z.number().min(1, "Odds must be at least 1").default(9),
  
  enableOddEven: z.boolean().default(false),
  oddEvenOdds: z.number().min(1, "Odds must be at least 1").default(1.9),
}).refine(data => {
  const openingDateTime = set(
    data.openingDate,
    {
      hours: parseInt(data.openingTime.split(':')[0]),
      minutes: parseInt(data.openingTime.split(':')[1]),
      seconds: 0
    }
  );
  
  const closingDateTime = set(
    data.closingDate,
    {
      hours: parseInt(data.closingTime.split(':')[0]),
      minutes: parseInt(data.closingTime.split(':')[1]),
      seconds: 0
    }
  );
  
  return closingDateTime > openingDateTime;
}, {
  message: "Closing time must be after opening time",
  path: ["closingTime"]
}).refine(data => {
  // At least one game type must be enabled
  return data.enableJodi || data.enableHurf || data.enableCross || data.enableOddEven;
}, {
  message: "At least one game type must be enabled",
  path: ["enableJodi"]
});

type MarketFormProps = {
  market?: Market;
  onSuccess?: () => void;
};

export default function MarketForm({ market, onSuccess }: MarketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const isEditing = !!market;
  
  // Parse existing market dates if editing
  let defaultOpeningDate: Date | undefined;
  let defaultOpeningTime: string | undefined;
  let defaultClosingDate: Date | undefined;
  let defaultClosingTime: string | undefined;
  
  if (isEditing) {
    const openingDateTime = new Date(market.openingTime);
    const closingDateTime = new Date(market.closingTime);
    
    defaultOpeningDate = openingDateTime;
    defaultOpeningTime = format(openingDateTime, "HH:mm");
    defaultClosingDate = closingDateTime;
    defaultClosingTime = format(closingDateTime, "HH:mm");
  }
  
  const form = useForm<z.infer<typeof marketFormSchema>>({
    resolver: zodResolver(marketFormSchema),
    defaultValues: {
      name: market?.name || "",
      bannerImage: market?.bannerImage || "",
      openingDate: defaultOpeningDate || new Date(),
      openingTime: defaultOpeningTime || "09:00",
      closingDate: defaultClosingDate || add(new Date(), { hours: 3 }),
      closingTime: defaultClosingTime || "12:00",
      
      // Default game types
      enableJodi: true,
      jodiOdds: 90,
      enableHurf: true,
      hurfOdds: 9,
      enableCross: true,
      crossOdds: 9,
      enableOddEven: true,
      oddEvenOdds: 1.9,
    },
  });
  
  async function onSubmit(values: z.infer<typeof marketFormSchema>) {
    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const openingDateTime = set(
        values.openingDate,
        {
          hours: parseInt(values.openingTime.split(':')[0]),
          minutes: parseInt(values.openingTime.split(':')[1]),
          seconds: 0
        }
      );
      
      const closingDateTime = set(
        values.closingDate,
        {
          hours: parseInt(values.closingTime.split(':')[0]),
          minutes: parseInt(values.closingTime.split(':')[1]),
          seconds: 0
        }
      );
      
      const marketData = {
        name: values.name,
        bannerImage: values.bannerImage,
        openingTime: openingDateTime.toISOString(),
        closingTime: closingDateTime.toISOString(),
        status: "upcoming", // Default for new markets
      };
      
      let createdMarketId: number;
      
      if (isEditing) {
        await apiRequest("PATCH", `/api/markets/${market.id}`, marketData);
        createdMarketId = market.id;
        toast({
          title: "Market updated",
          description: "Market has been updated successfully",
        });
      } else {
        const response = await apiRequest("POST", "/api/markets", marketData);
        const newMarket = await response.json();
        createdMarketId = newMarket.id;
        toast({
          title: "Market created",
          description: "New market has been created successfully",
        });
      }
      
      // Create the game types for this market
      if (createdMarketId) {
        // Build an array of game types to create
        const gameTypesToCreate = [];
        
        if (values.enableJodi) {
          gameTypesToCreate.push({
            marketId: createdMarketId,
            gameType: GameType.JODI,
            odds: values.jodiOdds,
            isActive: true
          });
        }
        
        if (values.enableHurf) {
          gameTypesToCreate.push({
            marketId: createdMarketId,
            gameType: GameType.HURF,
            odds: values.hurfOdds,
            isActive: true
          });
        }
        
        if (values.enableCross) {
          gameTypesToCreate.push({
            marketId: createdMarketId,
            gameType: GameType.CROSS,
            odds: values.crossOdds,
            isActive: true
          });
        }
        
        if (values.enableOddEven) {
          gameTypesToCreate.push({
            marketId: createdMarketId,
            gameType: GameType.ODD_EVEN,
            odds: values.oddEvenOdds,
            isActive: true
          });
        }
        
        // Create each game type
        for (const gameTypeData of gameTypesToCreate) {
          await apiRequest("POST", "/api/market-game-types", gameTypeData);
        }
        
        toast({
          title: "Game types created",
          description: `Created ${gameTypesToCreate.length} game types for this market`,
        });
      }
      
      // Refresh markets data
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/markets/${createdMarketId}/game-types`] });
      
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Market Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Mumbai Matka" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bannerImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banner Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/banner.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="openingDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Opening Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="openingTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="closingDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Closing Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="closingTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Closing Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="border rounded-md p-4 mb-4">
          <h3 className="text-lg font-semibold mb-4">Game Types</h3>
          <div className="space-y-4">
            {/* Jodi Game Type */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <FormField
                  control={form.control}
                  name="enableJodi"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Jodi (Double Digit)</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Bet on specific two-digit combinations
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jodiOdds"
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel>Odds</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          value={field.value}
                          disabled={!form.watch("enableJodi")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Hurf Game Type */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <FormField
                  control={form.control}
                  name="enableHurf"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Hurf (Position-based)</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Bet on specific positions in a number
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hurfOdds"
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel>Odds</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={0.1}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          value={field.value}
                          disabled={!form.watch("enableHurf")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Cross Game Type */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <FormField
                  control={form.control}
                  name="enableCross"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Cross (Multi-position)</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Bet on numbers that may appear in multiple positions
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="crossOdds"
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel>Odds</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={0.1}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          value={field.value}
                          disabled={!form.watch("enableCross")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Odd-Even Game Type */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <FormField
                  control={form.control}
                  name="enableOddEven"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Odd-Even</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Bet on whether the result will be odd or even
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="oddEvenOdds"
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel>Odds</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={0.1}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          value={field.value}
                          disabled={!form.watch("enableOddEven")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        
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
              (isEditing ? "Updating..." : "Creating...") : 
              (isEditing ? "Update Market" : "Create Market")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
