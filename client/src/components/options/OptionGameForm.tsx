import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, add, set } from "date-fns";
import { cn } from "@/lib/utils";
import { OptionGame } from "@shared/schema";

// Create schema for the option game form
const optionGameFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  teamA: z.string().min(1, "Team A name is required"),
  teamB: z.string().min(1, "Team B name is required"),
  bannerImage: z.string().optional(),
  odds: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 1;
  }, { message: "Odds must be greater than 1" }),
  openingDate: z.date({
    required_error: "Opening date is required",
  }),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  closingDate: z.date({
    required_error: "Closing date is required",
  }),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
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
});

type OptionGameFormProps = {
  optionGame?: OptionGame;
  onSuccess?: () => void;
};

export default function OptionGameForm({ optionGame, onSuccess }: OptionGameFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const isEditing = !!optionGame;
  
  // Parse existing option game dates if editing
  let defaultOpeningDate: Date | undefined;
  let defaultOpeningTime: string | undefined;
  let defaultClosingDate: Date | undefined;
  let defaultClosingTime: string | undefined;
  
  if (isEditing) {
    const openingDateTime = new Date(optionGame.openingTime);
    const closingDateTime = new Date(optionGame.closingTime);
    
    defaultOpeningDate = openingDateTime;
    defaultOpeningTime = format(openingDateTime, "HH:mm");
    defaultClosingDate = closingDateTime;
    defaultClosingTime = format(closingDateTime, "HH:mm");
  }
  
  const form = useForm<z.infer<typeof optionGameFormSchema>>({
    resolver: zodResolver(optionGameFormSchema),
    defaultValues: {
      title: optionGame?.title || "",
      teamA: optionGame?.teamA || "",
      teamB: optionGame?.teamB || "",
      bannerImage: optionGame?.bannerImage || "",
      odds: optionGame?.odds.toString() || "1.9",
      openingDate: defaultOpeningDate || new Date(),
      openingTime: defaultOpeningTime || "09:00",
      closingDate: defaultClosingDate || add(new Date(), { hours: 3 }),
      closingTime: defaultClosingTime || "12:00",
    },
  });
  
  async function onSubmit(values: z.infer<typeof optionGameFormSchema>) {
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
      
      const optionGameData = {
        title: values.title,
        teamA: values.teamA,
        teamB: values.teamB,
        bannerImage: values.bannerImage,
        odds: parseFloat(values.odds),
        openingTime: openingDateTime.toISOString(),
        closingTime: closingDateTime.toISOString(),
        status: "upcoming", // Default for new option games
      };
      
      if (isEditing) {
        await apiRequest("PATCH", `/api/option-games/${optionGame.id}`, optionGameData);
        toast({
          title: "Option game updated",
          description: "Option game has been updated successfully",
        });
      } else {
        await apiRequest("POST", "/api/option-games", optionGameData);
        toast({
          title: "Option game created",
          description: "New option game has been created successfully",
        });
      }
      
      // Refresh option games data
      queryClient.invalidateQueries({ queryKey: ["/api/option-games"] });
      
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. India vs Australia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="teamA"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team A</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. India" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="teamB"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team B</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Australia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
        
        <FormField
          control={form.control}
          name="odds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Winning Odds</FormLabel>
              <FormControl>
                <Input type="number" min="1.1" step="0.1" placeholder="1.9" {...field} />
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
              (isEditing ? "Update Option Game" : "Create Option Game")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
