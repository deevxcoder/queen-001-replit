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
import { User, UserRole, UserStatus } from "@shared/schema";

// Base schema for both create and edit
const baseUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  role: z.enum([UserRole.ADMIN, UserRole.SUBADMIN, UserRole.PLAYER]),
  status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]),
  walletBalance: z.string().refine(val => !isNaN(parseFloat(val)), { 
    message: "Wallet balance must be a valid number" 
  }),
  subadminId: z.string().optional()
});

// Additional fields for creating a new user
const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

interface UserFormProps {
  user?: User;
  isAdmin?: boolean;
  subadminId?: number;
  onSuccess?: () => void;
}

export default function UserForm({ user, isAdmin = false, subadminId, onSuccess }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const isEditing = !!user;
  const formSchema = isEditing ? baseUserSchema : createUserSchema;
  
  // Set up form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      role: user?.role || (isAdmin ? UserRole.PLAYER : UserRole.PLAYER),
      status: user?.status || UserStatus.ACTIVE,
      walletBalance: user?.walletBalance.toString() || "0",
      subadminId: user?.subadminId?.toString() || subadminId?.toString() || "",
      ...(isEditing ? {} : { password: "", confirmPassword: "" })
    },
  });
  
  // Watch the role field to conditionally display subadmin
  const role = form.watch("role");
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      const userData = {
        ...values,
        walletBalance: parseFloat(values.walletBalance),
        subadminId: values.subadminId ? parseInt(values.subadminId) : null
      };
      
      // If not admin, force certain values
      if (!isAdmin) {
        userData.role = UserRole.PLAYER;
        userData.subadminId = subadminId || null;
      }
      
      if (isEditing) {
        // Remove password from update payload
        const { password, confirmPassword, ...updateData } = userData as any;
        
        await apiRequest("PATCH", `/api/users/${user.id}`, updateData);
        toast({
          title: "User updated",
          description: "User has been updated successfully",
        });
      } else {
        await apiRequest("POST", "/api/users", userData);
        toast({
          title: "User created",
          description: "New user has been created successfully",
        });
      }
      
      // Refresh users data
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {!isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isAdmin && (
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                      <SelectItem value={UserRole.SUBADMIN}>Subadmin</SelectItem>
                      <SelectItem value={UserRole.PLAYER}>Player</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={UserStatus.BLOCKED}>Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="walletBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wallet Balance</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {isAdmin && role === UserRole.PLAYER && (
            <FormField
              control={form.control}
              name="subadminId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Subadmin (ID)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Leave empty for admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
              (isEditing ? "Update User" : "Create User")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
