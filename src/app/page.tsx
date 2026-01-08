import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-accent p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
                <Stethoscope className="h-10 w-10 text-primary" />
            </div>
        </div>
        <Card className="shadow-2xl rounded-2xl">
          <CardHeader className="items-center text-center pt-8">
            <CardTitle className="text-4xl font-bold tracking-tight">Digi Health</CardTitle>
            <CardDescription className="pt-2 text-base">
              Your Digital Health Partner in Bangladesh.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-8">
            <p className="text-center text-muted-foreground px-4">
              A comprehensive solution for managing health records and hospital information, connecting doctors, patients, and organizations seamlessly.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8 px-8">
            <Button asChild size="lg" className="w-full text-base font-semibold">
              <Link href="/login">Login to Your Account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full text-base font-semibold">
              <Link href="/register">Create an Account</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      <footer className="mt-12 text-center text-sm text-foreground/60">
        <p>&copy; {new Date().getFullYear()} Digi Health. All rights reserved.</p>
        <p className="mt-1">Compliant, Secure, and Built for Bangladesh.</p>
      </footer>
    </main>
  );
}
