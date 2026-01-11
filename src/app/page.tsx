
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, HeartPulse, Brain, Zap, Baby, ShieldCheck, Search, Building } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';
import { placeholderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

const featureCards = [
  {
    icon: HeartPulse,
    title: "Everyday & Chronic Care",
    description: "Manage your health with ease, from regular check-ups to ongoing condition management."
  },
  {
    icon: Brain,
    title: "Mental Health",
    description: "Access compassionate and confidential mental wellness support from our specialists."
  },
  {
    icon: Zap,
    title: "Urgent Care",
    description: "Get prompt medical attention for non-life-threatening conditions when you need it most."
  },
  {
    icon: Baby,
    title: "Family Care",
    description: "Comprehensive healthcare services for every member of your family, at every stage of life."
  },
  {
    icon: ShieldCheck,
    title: "Wellness & Prevention",
    description: "Stay proactive about your health with preventive screenings and personalized wellness plans."
  },
  {
    icon: Stethoscope,
    title: "Specialty Care",
    description: "Connect with a network of specialists to address your specific health needs."
  }
];

export default function Home() {
  const heroImage = placeholderImages.find(p => p.id === 'hero-background-bangladesh');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-primary">
                <Stethoscope className="h-6 w-6" />
                <span>Digi Health</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link href="/" className="text-foreground font-semibold">Home</Link>
                <Link href="#" className="text-foreground/80 hover:text-foreground">Find Care</Link>
                <Link href="#" className="text-foreground/80 hover:text-foreground">What We Treat</Link>
                <Link href="#" className="text-foreground/80 hover:text-foreground">For Employers</Link>
                 <Link href="#" className="text-foreground/80 hover:text-foreground">About Us</Link>
            </nav>
            <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                    <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                    <Link href="/register">Sign Up</Link>
                </Button>
            </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] md:h-[75vh] flex items-center justify-center text-center text-white">
          {heroImage && (
            <>
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover -z-20 brightness-50"
                data-ai-hint={heroImage.imageHint}
                priority
              />
              <div className="absolute inset-0 bg-green-900/60 -z-10"></div>
            </>
          )}
          <div className="relative px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-primary">
              Exceptional primary care for all of you
            </h1>
            <p className="mt-4 md:mt-6 text-lg md:text-xl max-w-2xl mx-auto">
              One Medical is a membership-based primary care practice on a mission to make getting quality care more affordable, accessible, and enjoyable for all.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button size="lg" className="w-full sm:w-auto text-base font-semibold">
                <Search className="mr-2"/>
                Find Care Near You
              </Button>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base font-semibold">
                <Building className="mr-2"/>
                Explore Employer Plans
              </Button>
            </div>
          </div>
        </section>

        {/* What We Treat Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">Care for your whole life</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From everyday needs to specialized services, we're here to support your health journey at every step.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featureCards.map((feature, index) => (
                <Card key={index} className="text-center p-6 bg-card hover:shadow-lg transition-shadow duration-300">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                      <feature.icon className="h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 md:py-24 bg-background-soft">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Join Digi Health today and experience a new standard of healthcare.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="text-base font-semibold">
                <Link href="/register">Create an Account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Digi Health. All rights reserved.</p>
          <p className="mt-1">Compliant, Secure, and Built for Bangladesh.</p>
        </div>
      </footer>
    </div>
  );
}
