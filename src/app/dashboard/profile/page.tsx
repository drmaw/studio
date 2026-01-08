
'use client'

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, UserPlus, Cake, User, MapPin, Droplet, Fingerprint, Users, Edit, Save, XCircle, Phone, HeartPulse, Siren, Wind, Plus, X, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { differenceInYears, parseISO, format, isValid } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import type { UserDemographics } from "@/lib/definitions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HealthIdCard } from "@/components/dashboard/health-id-card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";


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

const ProfileInfoRow = ({ icon: Icon, label, value, children }: { icon: React.ElementType, label: string, value?: string | null, children?: React.ReactNode }) => {
  if (!value && !children) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {value && <p className="font-medium">{value}</p>}
        {children}
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

const availableConditions = ['Asthma', 'Diabetes', 'Hypertension', 'CKD'];

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [age, setAge] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserDemographics>>({});
  const [allergyInput, setAllergyInput] = useState('');
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      const initialData = {
          ...user.demographics,
          chronicConditions: user.demographics?.chronicConditions || [],
          allergies: user.demographics?.allergies || [],
      };
      setFormData(initialData);

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

  const handleAddAllergy = () => {
    if (allergyInput && !formData.allergies?.includes(allergyInput)) {
        setFormData(prev => ({ ...prev, allergies: [...(prev.allergies || []), allergyInput]}));
        setAllergyInput('');
    }
  }
  
  const handleRemoveAllergy = (allergyToRemove: string) => {
    setFormData(prev => ({ ...prev, allergies: prev.allergies?.filter(a => a !== allergyToRemove)}));
  }

  const handleToggleCondition = (condition: string) => {
    setFormData(prev => {
        const currentConditions = prev.chronicConditions || [];
        const newConditions = currentConditions.includes(condition)
            ? currentConditions.filter(c => c !== condition)
            : [...currentConditions, condition];
        return { ...prev, chronicConditions: newConditions };
    });
  };

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
    if (user) {
      setFormData({
        ...user.demographics,
        chronicConditions: user.demographics?.chronicConditions || [],
        allergies: user.demographics?.allergies || [],
      });
    }
    setIsEditing(false);
  }

  if (loading || !user) {
    return <div className="flex justify-center">
        <Skeleton className="h-96 w-full max-w-2xl" />
    </div>;
  }
  
  const isOnlyPatient = user.roles.length === 1 && user.roles[0] === 'patient';
  
  const dobDate = formData.dob ? parseISO(formData.dob) : null;
  const displayDob = dobDate && isValid(dobDate) ? format(dobDate, 'dd MMMM, yyyy') : 'N/A';

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <HealthIdCard user={user} />
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Personal & Medical Details</CardTitle>
                    <CardDescription className="text-sm pt-1">
                        Your personal information, demographics, and health conditions.
                    </CardDescription>
                  </div>
                   {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                )}
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 space-y-6">
                {isEditing ? (
                    <>
                        <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ProfileEditRow label="Mobile Number" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} />
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
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Medical Information</h3>
                            <div className="space-y-2">
                                <Label htmlFor="conditions" className="text-base">Chronic Conditions</Label>
                                <p className="text-sm text-muted-foreground">Select one or more conditions.</p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {availableConditions.map(condition => {
                                        const isSelected = formData.chronicConditions?.includes(condition);
                                        return (
                                            <Badge
                                                key={condition}
                                                variant={isSelected ? "default" : "outline"}
                                                onClick={() => handleToggleCondition(condition)}
                                                className="cursor-pointer text-base py-1 px-3 transition-all"
                                            >
                                                {condition}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="allergies" className="text-base">Allergies</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="allergies" 
                                        placeholder="e.g., Penicillin" 
                                        value={allergyInput} 
                                        onChange={(e) => setAllergyInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                                    />
                                    <Button type="button" onClick={handleAddAllergy}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {formData.allergies?.map(allergy => (
                                        <Badge key={allergy} variant="destructive" className="pr-1 capitalize bg-destructive/10 text-destructive-foreground border-destructive/20">
                                            {allergy}
                                            <button onClick={() => handleRemoveAllergy(allergy)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <ProfileInfoRow icon={Phone} label="Mobile Number" value={formData.mobileNumber} />
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
                    <Separator />
                    <h3 className="text-lg font-semibold border-b pb-2">Medical Information</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                         <ProfileInfoRow icon={HeartPulse} label="Chronic Conditions">
                             {formData.chronicConditions && formData.chronicConditions.length > 0 ? (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {formData.chronicConditions.map(c => (
                                        <Badge key={c} variant="outline" className="capitalize">
                                            {c}
                                        </Badge>
                                    ))}
                                </div>
                            ) : <p className="font-medium text-muted-foreground/80">None reported</p>}
                        </ProfileInfoRow>
                        <ProfileInfoRow icon={Siren} label="Allergies">
                             {formData.allergies && formData.allergies.length > 0 ? (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {formData.allergies.map(allergy => (
                                        <Badge key={allergy} variant="destructive" className="pr-1 capitalize bg-destructive/10 text-destructive-foreground border-destructive/20">
                                            {allergy}
                                        </Badge>
                                    ))}
                                </div>
                            ) : <p className="font-medium text-muted-foreground/80">None reported</p>}
                        </ProfileInfoRow>
                     </div>
                  </>
                )}
            </CardContent>

            <CardFooter className={cn("bg-muted/50 p-4 border-t flex", isEditing ? "justify-end" : "justify-between")}>
                 {!isEditing && (
                    <Button onClick={handleLogout} variant="destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                )}
                {isEditing && (
                    <div className="flex gap-2">
                        <Button onClick={handleCancel} variant="outline">
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
        {isOnlyPatient && <ApplyForRoleCard />}
      </div>
    </div>
  );
}

    