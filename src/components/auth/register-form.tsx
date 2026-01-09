

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
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import type { User, Patient } from "@/lib/definitions";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
});

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
      password: "",
      confirmPassword: ""
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      const batch = writeBatch(firestore);
      
      const isDevUser = values.email === 'dev@digihealth.com';
      const userId = isDevUser ? '1122334455' : firebaseUser.uid;
      const patientId = isDevUser ? '1122334455' : firebaseUser.uid;

      // Use a fixed ID for the dev user, otherwise use the auth UID
      const userRef = doc(firestore, "users", userId);
      const patientRef = doc(firestore, "patients", patientId);


      if (isDevUser) {
        // Create the super-user with all roles
         const newUser: Omit<User, 'id'> = {
            name: 'Dr. Dev',
            email: firebaseUser.email!,
            roles: ['doctor', 'patient', 'hospital_owner', 'marketing_rep', 'nurse', 'lab_technician', 'pathologist', 'pharmacist', 'manager', 'assistant_manager', 'front_desk'],
            organizationId: 'org-1',
            avatarUrl: `https://picsum.photos/seed/1122334455/100/100`,
            createdAt: serverTimestamp(),
            demographics: {
                dob: '1985-01-01',
                gender: 'Male',
                contact: '+1234567890',
                mobileNumber: '+1234567890',
            }
        };
        batch.set(userRef, newUser);

        const newPatient: Omit<Patient, 'id'> = {
            userId: userId,
            name: 'Dr. Dev',
            organizationId: 'org-1',
            demographics: {
                dob: '1985-01-01',
                gender: 'Male',
                contact: '+1234567890',
                address: '123 Dev Lane'
            },
            createdAt: serverTimestamp(),
        };
        batch.set(patientRef, newPatient);

      } else {
        // Standard patient registration
        const newUser: Omit<User, 'id'> = {
            name: values.name,
            email: firebaseUser.email!,
            roles: ['patient'],
            organizationId: "org-1", 
            avatarUrl: `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
            createdAt: serverTimestamp(),
            demographics: {}
        };
        batch.set(userRef, newUser);

        const newPatient: Omit<Patient, 'id'> = {
            userId: firebaseUser.uid,
            name: values.name,
            organizationId: "org-1",
            demographics: {
                dob: '',
                gender: 'Other',
                contact: '',
                address: ''
            },
            createdAt: serverTimestamp(),
        };
        batch.set(patientRef, newPatient);
      }


      await batch.commit();

      toast({
        title: "Registration Successful",
        description: "You can now log in with your credentials.",
      });

      router.push("/login");

    } catch (error: any) {
      console.error("Registration failed:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Could not create account. Please try again.",
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
                <Input placeholder="e.g. Karim Ahmed" {...field} />
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
                <Input placeholder="your.email@example.com" {...field} />
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
                <Input type="password" placeholder="••••••••" {...field} />
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
                <Input type="password" placeholder="••••••••" {...field} />
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
