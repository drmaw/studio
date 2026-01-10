import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Stethoscope } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-accent p-4 sm:p-8 relative">
       <Button asChild variant="outline" className="absolute top-4 left-4">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          Home
        </Link>
      </Button>
      <Card className="w-full max-w-sm shadow-xl rounded-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Stethoscope className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Welcome Back</CardTitle>
          <CardDescription>Login to your Digi Health account</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
