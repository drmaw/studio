
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth, useFirestore, commitBatch, writeBatch } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp } from "firebase/firestore";
import type { User, Patient, Organization, Membership, Role } from "@/lib/definitions";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  mobileNumber: z.string().min(10, { message: "Please enter a valid mobile number." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
});

// Function to generate a random 10-digit number as a string
const generateHealthId = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      mobileNumber: "",
      password: "",
      confirmPassword: ""
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Firebase services are not available. Please try again later.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;
      
      const healthId = generateHealthId();
      const batch = writeBatch(firestore);
      
      // Define document references
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const patientDocRef = doc(firestore, "patients", firebaseUser.uid);
      const orgId = `org-ind-${firebaseUser.uid}`; // Personal organization ID
      const orgDocRef = doc(firestore, "organizations", orgId);
      const memberDocRef = doc(firestore, "organizations", orgId, "members", firebaseUser.uid);

      // 1. Create the core User profile
      const newUser: Omit<User, 'id' | 'organizationId' | 'organizationName'> = {
          healthId: healthId,
          name: values.name,
          email: firebaseUser.email!,
          roles: ['patient'] as Role[],
          avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
          createdAt: serverTimestamp(),
          status: 'active',
          demographics: {
              dob: '',
              gender: 'Other',
              mobileNumber: values.mobileNumber,
              privacySettings: {
                discoverable: true,
                vitalsVisible: true,
              }
          }
      };

      // 2. Create the supplementary Patient record
      const newPatient: Omit<Patient, 'id'> = {
          createdAt: serverTimestamp(),
          chronicConditions: [],
          allergies: [],
      };
      
      // 3. Create a minimal personal organization for data siloing
      const newOrganization: Omit<Organization, 'id'> = {
          name: `${values.name}'s Personal Records`,
          ownerId: firebaseUser.uid,
          status: 'active',
          createdAt: serverTimestamp(),
      };

      // 4. Create the user's first membership within their personal organization
      const newMembership: Omit<Membership, 'id'> = {
          userId: firebaseUser.uid,
          userName: values.name,
          userHealthId: healthId,
          roles: ['patient'],
          status: 'active',
      };
      
      batch.set(userDocRef, newUser);
      batch.set(patientDocRef, newPatient);
      batch.set(orgDocRef, newOrganization);
      batch.set(memberDocRef, newMembership);

      commitBatch(batch, 'new user registration', () => {
        toast({
            title: "Registration Successful",
            description: "You can now log in with your credentials.",
        });
        router.push("/login");
      }, () => {
        // This error handler is for the batch commit. 
        // The createUser call will be caught by the outer try/catch
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: "Could not save your user profile. Please try again.",
        });
        setIsLoading(false);
      });
      
    } catch (error: any) {
      console.error("Registration failed:", error);
      // The default firebase error messages are user-friendly enough
      const message = error.code === 'auth/email-already-in-use' 
        ? 'An account with this email address already exists.'
        : 'Could not create account. Please try again.';

      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: message,
      });
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Karim Ahmed" {...field} autoComplete="name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your.email@example.com" {...field} autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 01712345678" {...field} autoComplete="tel" />
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
                <Input type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
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
                <Input type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-xs text-center text-muted-foreground px-4">
            By creating an account, you are registering as a patient. You can apply for other roles from your profile after logging in.
        </p>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
        </Button>
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </div>
      </form>
    </Form>
  );
}
