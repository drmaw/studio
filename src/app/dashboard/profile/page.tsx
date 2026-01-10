
'use client'

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Cake, User as UserIcon, MapPin, Droplet, Fingerprint, Users, Edit, Save, XCircle, Phone, HeartPulse, Siren, Plus, X, File, Building, Hash, IdCard, CheckCircle2, Clock, Hourglass, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { differenceInYears, parse, isValid, format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import type { UserDemographics, EmergencyContact, User } from "@/lib/definitions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HealthIdCard } from "@/components/dashboard/health-id-card";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditContactDialog } from "@/components/dashboard/edit-contact-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";


function ApplyForRoleCard() {
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [applicationStatus, setApplicationStatus] = useState<'submitted' | 'waiting_for_approval' | 'approved' | null>(null);
  const [appliedRole, setAppliedRole] = useState<string | null>(null);

  const handleApply = async (event: React.FormEvent) => {
    event.preventDefault();
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
    
    setAppliedRole(selectedRole);
    setApplicationStatus('submitted');
    
    toast({
      title: "Application Submitted",
      description: `Your application for the ${selectedRole.replace(/_/g, ' ')} role is being processed.`,
    });
    
    setIsSubmitting(false);
    setSelectedRole('');

    // Mock status progression
    setTimeout(() => {
        setApplicationStatus('waiting_for_approval');
    }, 2000);
     setTimeout(() => {
        setApplicationStatus('approved');
    }, 5000);
  };
  
  const renderRoleForm = () => {
    switch(selectedRole) {
      case 'doctor':
        return (
          <div className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="bmdc" className="flex items-center gap-2"><IdCard className="h-4 w-4" /> BMDC Registration Number</Label>
              <Input id="bmdc" placeholder="Enter your BMDC number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor-photo" className="flex items-center gap-2"><File className="h-4 w-4" /> Your Picture</Label>
              <Input id="doctor-photo" type="file" />
            </div>
          </div>
        );
      case 'nurse':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nurse-reg" className="flex items-center gap-2"><IdCard className="h-4 w-4" /> Registration Number</Label>
              <Input id="nurse-reg" placeholder="Enter your registration number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nurse-photo" className="flex items-center gap-2"><File className="h-4 w-4" /> Your Photo</Label>
              <Input id="nurse-photo" type="file" />
            </div>
          </div>
        );
      case 'organization_owner':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name" className="flex items-center gap-2"><Building className="h-4 w-4" /> Name of the Organization</Label>
              <Input id="org-name" placeholder="Enter organization name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-reg" className="flex items-center gap-2"><IdCard className="h-4 w-4" /> Registration Number</Label>
              <Input id="org-reg" placeholder="Enter organization registration number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-tin" className="flex items-center gap-2"><Hash className="h-4 w-4" /> TIN Number</Label>
              <Input id="org-tin" placeholder="Enter TIN number" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="org-address" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</Label>
              <Textarea id="org-address" placeholder="Enter organization address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-cert" className="flex items-center gap-2"><File className="h-4 w-4" /> Photo of Registration Certificate</Label>
              <Input id="org-cert" type="file" />
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  const renderStatus = () => {
    let statusText, Icon, colorClass, description;

    switch(applicationStatus) {
        case 'submitted':
            statusText = 'Submitted';
            Icon = Clock;
            colorClass = 'text-blue-500';
            description = 'Your application has been received and is pending review.';
            break;
        case 'waiting_for_approval':
            statusText = 'Waiting For Approval';
            Icon = Hourglass;
            colorClass = 'text-yellow-500';
            description = 'Your documents are being verified by our team. This may take some time.';
            break;
        case 'approved':
            statusText = 'Approved';
            Icon = CheckCircle2;
            colorClass = 'text-green-500';
            description = `Congratulations! Your role as a ${appliedRole?.replace(/_/g, ' ')} has been approved.`;
            break;
        default:
            return null;
    }
    
    return (
         <Card className="mt-6 bg-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Application Status
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center p-8">
                <Icon className={cn("h-16 w-16 mb-4", colorClass)} />
                <h3 className="text-xl font-semibold capitalize">Role: {appliedRole?.replace(/_/g, ' ')}</h3>
                <p className={cn("font-bold text-lg", colorClass)}>{statusText}</p>
                <p className="text-sm text-muted-foreground mt-2">{description}</p>
            </CardContent>
        </Card>
    )
  }

  if (applicationStatus) {
    return renderStatus();
  }

  return (
    <Card className="mt-6 bg-card">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-primary" />
          Apply for an Additional Role
        </CardTitle>
        <CardDescription className="text-sm pt-1">
          Upgrade your account to a medical professional or organization owner.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleApply}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="role-select">Select a role to apply for</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isSubmitting}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="organization_owner">Organization Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedRole && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium capitalize">{selectedRole.replace(/_/g, ' ')} Application</h3>
              {renderRoleForm()}
            </div>
          )}

        </CardContent>
        {selectedRole && (
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : `Apply for ${selectedRole.replace(/_/g, ' ')} Role`}
            </Button>
          </CardFooter>
        )}
      </form>
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
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];


export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const [age, setAge] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserDemographics>>({});
  const [allergyInput, setAllergyInput] = useState('');
  
  // State for new emergency contact
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [newContactHealthId, setNewContactHealthId] = useState('');
  const [newContactMethod, setNewContactMethod] = useState('details');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    
    const initialData = {
        ...user.demographics,
        chronicConditions: user.demographics?.chronicConditions || [],
        allergies: user.demographics?.allergies || [],
        emergencyContacts: user.demographics?.emergencyContacts || [],
    };
    setFormData(initialData);

    if (user.demographics?.dob) {
      try {
        const birthDate = parse(user.demographics.dob, "dd-MM-yyyy", new Date());
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
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleSelectChange = (name: keyof UserDemographics) => (value: string) => {
    setFormData(prev => ({...prev, [name]: value }));
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

  const handleAddEmergencyContact = async () => {
    let newContact: EmergencyContact | null = null;
    const common = { id: `ec-${Date.now()}`, relation: newContactRelation };

    if (newContactMethod === 'details' && newContactName && newContactRelation && newContactNumber) {
        newContact = { ...common, name: newContactName, contactNumber: newContactNumber };
    } else if (newContactMethod === 'healthId' && newContactHealthId && newContactRelation) {
        const userDocRef = doc(firestore, 'users', newContactHealthId);
        const contactUserDoc = await getDoc(userDocRef);
        if (!contactUserDoc.exists()) {
            toast({ variant: "destructive", title: "User not found", description: "No user exists with that Health ID."});
            return;
        }
        const contactUser = contactUserDoc.data() as User;
        newContact = { ...common, healthId: newContactHealthId, name: contactUser.name };
    } else {
        toast({ variant: "destructive", title: "Incomplete Information", description: "Please fill all required fields for the new contact."});
        return;
    }

    if (newContact) {
        setFormData(prev => ({...prev, emergencyContacts: [...(prev.emergencyContacts || []), newContact!]}));
        setNewContactName('');
        setNewContactRelation('');
        setNewContactNumber('');
        setNewContactHealthId('');
    }
  };

  const handleRemoveEmergencyContact = (id: string) => {
    setFormData(prev => ({ ...prev, emergencyContacts: prev.emergencyContacts?.filter(c => c.id !== id) }));
  };

  const handleUpdateEmergencyContact = (updatedContact: EmergencyContact) => {
    setFormData(prev => ({
        ...prev,
        emergencyContacts: prev.emergencyContacts?.map(c => c.id === updatedContact.id ? updatedContact : c)
    }));
  };

  const handleSave = () => {
    if (!user) return;
    
    const userRef = doc(firestore, "users", user.id);
    updateDocumentNonBlocking(userRef, { demographics: formData });

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
        emergencyContacts: user.demographics?.emergencyContacts || [],
      });
    }
    setIsEditing(false);
  }

  if (loading || !user) {
    return (
      <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <div className="flex justify-center">
              <Skeleton className="h-96 w-full max-w-2xl" />
          </div>
      </div>
    );
  }
  
  const isOnlyPatient = user.roles?.length === 1 && user.roles[0] === 'patient';
  
  const dobDate = formData.dob ? parse(formData.dob, "dd-MM-yyyy", new Date()) : null;
  const displayDob = dobDate && isValid(dobDate) ? format(dobDate, 'dd-MM-yyyy') : 'N/A';

  return (
    <div className="space-y-6">
        <HealthIdCard user={user} />
        <div className="flex justify-center">
            <div className="w-full max-w-2xl space-y-6">
                <Card className="bg-card">
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
                                    <ProfileEditRow label="Date of Birth (DD-MM-YYYY)" name="dob" value={formData.dob} onChange={handleInputChange} placeholder="DD-MM-YYYY" />
                                    <ProfileEditRow label="Gender" name="gender" value={formData.gender} onChange={handleInputChange} />
                                    <ProfileEditRow label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
                                    <ProfileEditRow label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleInputChange} />
                                    <ProfileEditRow label="NID" name="nid" value={formData.nid} onChange={handleInputChange} />
                                     <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground">Blood Group</Label>
                                        <Select value={formData.bloodGroup} onValueChange={handleSelectChange('bloodGroup')}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select blood group..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bloodGroups.map(group => (
                                                    <SelectItem key={group} value={group}>{group}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
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
                                                <Badge key={allergy} variant="destructive" className="pr-1 capitalize">
                                                    {allergy}
                                                    <button onClick={() => handleRemoveAllergy(allergy)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 text-destructive-foreground">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold border-b pb-2">Emergency Contacts</h3>
                                   {formData.emergencyContacts?.map((contact) => (
                                    <div key={contact.id} className="flex items-center justify-between p-2 rounded-md border">
                                        <div>
                                            <p className="font-semibold">{contact.name || 'N/A'}</p>
                                            <p className="text-sm text-muted-foreground">{contact.relation}</p>
                                            <p className="text-sm text-muted-foreground">{contact.contactNumber || `Health ID: ${contact.healthId}`}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <EditContactDialog contact={contact} onSave={handleUpdateEmergencyContact} />
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveEmergencyContact(contact.id)}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                   ))}
                                   <div className="p-4 border-2 border-dashed rounded-lg bg-background">
                                       <Tabs value={newContactMethod} onValueChange={setNewContactMethod}>
                                           <TabsList className="grid w-full grid-cols-2">
                                               <TabsTrigger value="details">Add by Details</TabsTrigger>
                                               <TabsTrigger value="healthId">Add by Health ID</TabsTrigger>
                                           </TabsList>
                                           <TabsContent value="details" className="pt-4 space-y-2">
                                                <Input placeholder="Full Name" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} autoComplete="name"/>
                                                <Input placeholder="Relation (e.g., Mother)" value={newContactRelation} onChange={(e) => setNewContactRelation(e.target.value)} />
                                                <Input placeholder="Contact Number" value={newContactNumber} onChange={(e) => setNewContactNumber(e.target.value)} />
                                           </TabsContent>
                                           <TabsContent value="healthId" className="pt-4 space-y-2">
                                                <Input placeholder="Health ID" value={newContactHealthId} onChange={(e) => setNewContactHealthId(e.target.value)} />
                                                <Input placeholder="Relation (e.g., Doctor)" value={newContactRelation} onChange={(e) => setNewContactRelation(e.target.value)} />
                                           </TabsContent>
                                       </Tabs>
                                       <Button className="mt-2 w-full" type="button" onClick={handleAddEmergencyContact}><Plus className="mr-2 h-4 w-4" />Add Contact</Button>
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
                                <ProfileInfoRow icon={UserIcon} label="Father's Name" value={formData.fatherName} />
                                <ProfileInfoRow icon={UserIcon} label="Mother's Name" value={formData.motherName} />
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
                                                <Badge key={allergy} variant="destructive" className="pr-1 capitalize">
                                                    {allergy}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : <p className="font-medium text-muted-foreground/80">None reported</p>}
                                </ProfileInfoRow>
                            </div>
                            <Separator />
                            <h3 className="text-lg font-semibold border-b pb-2">Emergency Contacts</h3>
                            <div className="space-y-2">
                                {formData.emergencyContacts && formData.emergencyContacts.length > 0 ? (
                                    formData.emergencyContacts.map(contact => (
                                        <div key={contact.id} className="flex items-center p-3 rounded-md bg-secondary">
                                            <div className="flex-1">
                                                <p className="font-semibold">{contact.name} <span className="font-normal text-muted-foreground">({contact.relation})</span></p>
                                                <p className="text-sm text-muted-foreground">
                                                    {contact.contactNumber ? (
                                                        <span className="flex items-center gap-2"><Phone className="h-3 w-3" />{contact.contactNumber}</span>
                                                    ) : (
                                                        <span className="flex items-center gap-2"><Fingerprint className="h-3 w-3" />Health ID: {contact.healthId}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No emergency contacts added.</p>
                                )}
                            </div>
                        </>
                        )}
                    </CardContent>

                    {isEditing && (
                        <CardFooter className="bg-muted/50 p-4 border-t flex justify-end">
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
                        </CardFooter>
                    )}
                </Card>
                {isOnlyPatient && <ApplyForRoleCard />}
            </div>
        </div>
    </div>
  );
}

    