import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { login, useAuth, getRoleBasedPath } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { loginSchema } from "@shared/schema";

export default function LoginForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Check if already authenticated and redirect
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const redirectPath = getRoleBasedPath(user.role);
      setLocation(redirectPath);
    }
  }, [isAuthenticated, user, setLocation]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const user = await login(values.username, values.password);
      toast({
        title: "Login successful",
        description: "You've been logged in successfully.",
      });
      
      // Manual redirect after successful login
      if (user && user.role) {
        const redirectPath = getRoleBasedPath(user.role);
        setTimeout(() => {
          setLocation(redirectPath);
        }, 500); // Small delay to ensure state updates
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <span className="text-amber font-bold text-3xl font-heading">Queen</span>
            <span className="text-white font-bold text-3xl font-heading">Games</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-amber hover:bg-amber/90 text-black" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <span 
              className="text-amber hover:underline cursor-pointer"
              onClick={() => setLocation("/register")}
            >
              Sign up
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
