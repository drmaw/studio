
'use client'

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Mail, ShieldCheck, UserPlus, Cake, User, MapPin, Droplet, Fingerprint, Users, Edit, Save, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { differenceInYears, parseISO, format, isValid } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import type { UserDemographics } from "@/lib/definitions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const ProfileEditRow = ({ label, name, value, onChange, placeholder }: { label: string, name: keyof UserDemographics, value: string | undefined, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string }) => {
    return (
        <div className="space-y-1">
            <Label htmlFor={name} className="text-sm text-muted-foreground">{label}</Label>
            <Input id={name} name={name} value={value || ''} onChange={onChange} placeholder={placeholder || label} />
        </div>
    )
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [age, setAge] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserDemographics>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setFormData(user.demographics || {});
      if (user.demographics?.dob) {
        try {
          const birthDate = parseISO(user.demographics.dob);
          if(isValid(birthDate)) {
            const calculatedAge = differenceInYears(new Date(), birthDate);
            setAge(calculatedAge);
          } else {
             setAge(null);
          }
        } catch (error) {
          console.error("Invalid date format for DOB:", user.demographics.dob);
          setAge(null);
        }
      }
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    localStorage.removeItem("digi-health-user-id");
    router.push('/');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleSave = async () => {
     // Mock API call to save user data
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app you would update this in the backend.
    console.log("Updated user data:", formData);
    toast({
        title: "Profile Updated",
        description: "Your personal information has been saved.",
    });
    setIsEditing(false);
  }

  const handleCancel = () => {
    setFormData(user?.demographics || {});
    setIsEditing(false);
  }

  if (loading || !user) {
    return <div className="flex justify-center">
        <Skeleton className="h-96 w-full max-w-2xl" />
    </div>;
  }
  
  const userInitials = user.name.split(' ').map(n => n[0]).join('');

  // A user is only a "pure" patient if they have exactly one role, and it's 'patient'.
  const isOnlyPatient = user.roles.length === 1 && user.roles[0] === 'patient';
  
  const dobDate = formData.dob ? parseISO(formData.dob) : null;
  const displayDob = dobDate && isValid(dobDate) ? format(dobDate, 'dd MMMM, yyyy') : 'N/A';

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
                {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                )}
            </CardHeader>
            
            <Separator />

            <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProfileEditRow label="Date of Birth (YYYY-MM-DD)" name="dob" value={formData.dob} onChange={handleInputChange} placeholder="YYYY-MM-DD" />
                        <ProfileEditRow label="Gender" name="gender" value={formData.gender} onChange={handleInputChange} />
                        <ProfileEditRow label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
                        <ProfileEditRow label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleInputChange} />
                        <ProfileEditRow label="NID" name="nid" value={formData.nid} onChange={handleInputChange} />
                        <ProfileEditRow label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} />
                        <div className="md:col-span-2">
                            <ProfileEditRow label="Present Address" name="presentAddress" value={formData.presentAddress} onChange={handleInputChange} />
                        </div>
                        <div className="md:col-span-2">
                            <ProfileEditRow label="Permanent Address" name="permanentAddress" value={formData.permanentAddress} onChange={handleInputChange} />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="flex items-start gap-3">
                            <Cake className="h-4 w-4 mt-1 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Date of Birth</p>
                                <p className="font-medium">
                                    {displayDob}
                                    {age !== null && <span className="text-sm text-muted-foreground"> (Age: {age})</span>}
                                </p>
                            </div>
                        </div>
                        <ProfileInfoRow icon={Users} label="Gender" value={formData.gender} />
                        <ProfileInfoRow icon={User} label="Father's Name" value={formData.fatherName} />
                        <ProfileInfoRow icon={User} label="Mother's Name" value={formData.motherName} />
                        <ProfileInfoRow icon={Fingerprint} label="NID" value={formData.nid} />
                        <ProfileInfoRow icon={Droplet} label="Blood Group" value={formData.bloodGroup} />

                        <div className="md:col-span-2">
                        <ProfileInfoRow icon={MapPin} label="Present Address" value={formData.presentAddress} />
                        </div>
                        <div className="md:col-span-2">
                        <ProfileInfoRow icon={MapPin} label="Permanent Address" value={formData.permanentAddress} />
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-muted/50 p-4 border-t flex justify-end gap-2">
                {isEditing ? (
                    <>
                        <Button onClick={handleCancel} variant="outline">
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </>
                ) : (
                    <Button onClick={handleLogout} variant="destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                )}
            </CardFooter>
        </Card>
        {isOnlyPatient && <ApplyForRoleCard />}
      </div>
    </div>
  );
}

    