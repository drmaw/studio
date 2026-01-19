
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function PrivacyPolicyPage() {
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleDateString('en-GB'));
  }, []);

  return (
    <div className="min-h-screen bg-background-soft">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-primary">
            <Stethoscope className="h-6 w-6" />
            <span>Digi Health</span>
          </Link>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-16">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </CardHeader>
          <CardContent className="prose prose-zinc dark:prose-invert max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Welcome to Digi Health. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
            </p>

            <h2>2. Information We Collect</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect includes:
            </p>
            <ul>
              <li>
                <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and telephone number, and demographic information, such as your age, gender, and hometown, that you voluntarily give to us when you register with the application.
              </li>
              <li>
                <strong>Health Information:</strong> Information related to your health, such as medical history, diagnoses, treatments, medications, and vital signs that you or healthcare professionals provide.
              </li>
              <li>
                <strong>Derivative Data:</strong> Information our servers automatically collect when you access the application, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the application.
              </li>
            </ul>

            <h2>3. Use of Your Information</h2>
            <p>
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the application to:
            </p>
            <ul>
              <li>Create and manage your account.</li>
              <li>Provide healthcare services and facilitate communication between you and healthcare providers.</li>
              <li>Generate a personal profile of you to make future visits to the application more personalized.</li>
              <li>Monitor and analyze usage and trends to improve your experience with the application.</li>
              <li>Notify you of updates to the application.</li>
            </ul>

            <h2>4. Disclosure of Your Information</h2>
            <p>
              We do not share your personally identifiable information with third parties except as described in this Privacy Policy. We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
            </p>
            <ul>
              <li>
                <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
              </li>
              <li>
                <strong>Healthcare Providers:</strong> We may share your information with doctors, hospitals, and other healthcare providers for treatment purposes, based on your explicit consent settings within the application.
              </li>
            </ul>

            <h2>5. Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>

            <h2>6. Your Rights</h2>
            <p>
              You have the right to review, change, or terminate your account at any time. You can review or change the information in your account or terminate your account by logging into your account settings and updating your account.
            </p>

            <h2>7. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at: privacy@digihealth.example.com
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
