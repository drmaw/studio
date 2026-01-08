
'use client'

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Mail, ShieldCheck, UserPlus, Cake, User, MapPin, Droplet, Fingerprint, Users, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { differenceInYears, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

function ApplyForRoleCard() {
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleApply = async () => {
    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "No Role Selected",
        description: "Please select a role to apply for.",
      });
      return;
    }

    setIsSubmitting(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Application Submitted",
      description: `Your application for the ${selectedRole.replace('_', ' ')} role has been submitted for review.`,
    });
    
    setIsSubmitting(false);
    setSelectedRole('');
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UserPlus className="h-5 w-5 text-primary" />
          Apply for an Additional Role
        </CardTitle>
        <CardDescription>
          If you are a medical professional, you can apply to upgrade your account.
        </CardDescription>
      </CardHeader>
      {/* Role application form can be re-added here if needed */}
    </Card>
  );
}

const ProfileInfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user?.demographics?.dob) {
      try {
        const birthDate = parseISO(user.demographics.dob);
        const calculatedAge = differenceInYears(new Date(), birthDate);
        setAge(calculatedAge);
      } catch (error) {
        console.error("Invalid date format for DOB:", user.demographics.dob);
        setAge(null);
      }
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    localStorage.removeItem("digi-health-user-id");
    router.push('/');
  };

  if (loading || !user) {
    return <div className="flex justify-center">
        <Skeleton className="h-96 w-full max-w-2xl" />
    </div>;
  }
  
  const userInitials = user.name.split(' ').map(n => n[0]).join('');
  const { demographics } = user;

  // A user is only a "pure" patient if they have exactly one role, and it's 'patient'.
  const isOnlyPatient = user.roles.length === 1 && user.roles[0] === 'patient';

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        <Card>
            <CardHeader className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle className="text-3xl">{user.name}</CardTitle>
                    <CardDescription className="text-base pt-2 flex flex-wrap gap-x-4 gap-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <ShieldCheck className="h-4 w-4" />
                            <span>ID: {user.id}</span>
                        </div>
                    </CardDescription>
                    <div className="flex flex-wrap gap-2 pt-3">
                        {user.roles.map(role => (
                            <Badge key={role} variant="secondary" className="capitalize">
                                {role.replace('_', ' ')}
                            </Badge>
                        ))}
                    </div>
                </div>
                <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
            </CardHeader>
            
            <Separator />

            <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="flex items-start gap-3">
                        <Cake className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Date of Birth</p>
                            <p className="font-medium">
                                {demographics?.dob ? new Date(demographics.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                                {age !== null && <span className="text-sm text-muted-foreground"> (Age: {age})</span>}
                            </p>
                        </div>
                    </div>
                    <ProfileInfoRow icon={Users} label="Gender" value={demographics?.gender} />
                    <ProfileInfoRow icon={User} label="Father's Name" value={demographics?.fatherName} />
                    <ProfileInfoRow icon={User} label="Mother's Name" value={demographics?.motherName} />
                    <ProfileInfoRow icon={Fingerprint} label="NID" value={demographics?.nid} />
                    <ProfileInfoRow icon={Droplet} label="Blood Group" value={demographics?.bloodGroup} />

                    <div className="md:col-span-2">
                      <ProfileInfoRow icon={MapPin} label="Present Address" value={demographics?.presentAddress} />
                    </div>
                    <div className="md:col-span-2">
                       <ProfileInfoRow icon={MapPin} label="Permanent Address" value={demographics?.permanentAddress} />
                    </div>
                </div>
            </CardContent>

            <CardFooter className="bg-muted/50 p-4 border-t flex justify-end">
                <Button onClick={handleLogout} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </CardFooter>
        </Card>
        {isOnlyPatient && <ApplyForRoleCard />}
      </div>
    </div>
  );
}
