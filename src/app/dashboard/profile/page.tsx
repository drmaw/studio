
'use client'

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Cake, User as UserIcon, MapPin, Droplet, Fingerprint, Users, Edit, Save, XCircle, Phone, HeartPulse, Siren, Plus, X, File, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { differenceInYears, parse, isValid, format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import type { Role, UserDemographics, EmergencyContact, User } from "@/lib/definitions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HealthIdCard } from "@/components/dashboard/health-id-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditContactDialog } from "@/components/dashboard/edit-contact-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore } from "@/firebase";
import { doc, getDocs, collection, query, where, limit, updateDoc } from "firebase/firestore";
import { ApplyForRoleCard } from "@/components/dashboard/profile/apply-for-role-card";


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
const genders = ['Male', 'Female', 'Other'];
const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];


export default function ProfilePage() {
  const { user, loading, hasRole } = useAuth();
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

  const stableHasRole = useCallback(hasRole, [user]);

  useEffect(() => {
    if (user) {
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
        } else {
            setAge(null);
        }
    }
  }, [user]);

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
        if (!firestore) {
            toast({ variant: "destructive", title: "Database not available", description: "Cannot verify Health ID right now."});
            return;
        }
        const usersRef = collection(firestore, 'users');
        const userQuery = query(usersRef, where('healthId', '==', newContactHealthId), limit(1));
        const contactUserSnapshot = await getDocs(userQuery);

        if (contactUserSnapshot.empty) {
            toast({ variant: "destructive", title: "User not found", description: "No user exists with that Health ID."});
            return;
        }
        const contactUser = contactUserSnapshot.docs[0].data() as User;
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

  const handleSave = async () => {
    if (!user || !firestore) return;
    
    try {
        const userRef = doc(firestore, "users", user.id);
        await updateDoc(userRef, { demographics: formData });
        
        // Also update the patient document with relevant info
        const patientRef = doc(firestore, "patients", user.id);
        const patientUpdateData = {
            'demographics.dob': formData.dob,
            'demographics.gender': formData.gender,
            'demographics.contact': formData.mobileNumber,
            chronicConditions: formData.chronicConditions,
            allergies: formData.allergies,
        };
        await updateDoc(patientRef, patientUpdateData);

        toast({
            title: "Profile Updated",
            description: "Your personal information has been saved.",
        });
        setIsEditing(false);
    } catch (error) {
        console.error("Failed to update profile:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not save your profile changes.",
        });
    }
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
  
  const isOnlyPatient = user.roles?.length === 1 && stableHasRole('patient');
  
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
                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground">Gender</Label>
                                        <Select value={formData.gender} onValueChange={handleSelectChange('gender')}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {genders.map(gender => (
                                                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm text-muted-foreground">Marital Status</Label>
                                        <Select value={formData.maritalStatus} onValueChange={handleSelectChange('maritalStatus')}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select marital status..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {maritalStatuses.map(status => (
                                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ProfileInfoRow icon={Phone} label="Mobile" value={user.demographics?.mobileNumber} />
                                    <ProfileInfoRow icon={Cake} label="Date of Birth & Age" value={displayDob && age ? `${displayDob} (${age} years)` : displayDob} />
                                    <ProfileInfoRow icon={UserIcon} label="Gender" value={user.demographics?.gender} />
                                    <ProfileInfoRow icon={Fingerprint} label="NID" value={user.demographics?.nid} />
                                    <ProfileInfoRow icon={Users} label="Marital Status" value={user.demographics?.maritalStatus} />
                                    <div className="md:col-span-2">
                                        <ProfileInfoRow icon={MapPin} label="Present Address" value={user.demographics?.presentAddress} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <ProfileInfoRow icon={MapPin} label="Permanent Address" value={user.demographics?.permanentAddress} />
                                    </div>
                                </div>
                                <Separator />
                                <h3 className="text-lg font-semibold border-b pb-2 pt-2">Medical Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ProfileInfoRow icon={Droplet} label="Blood Group" value={user.demographics?.bloodGroup} />
                                    <ProfileInfoRow icon={HeartPulse} label="Chronic Conditions">
                                        {formData.chronicConditions && formData.chronicConditions.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {formData.chronicConditions.map(c => <Badge key={c} variant="outline" className="capitalize">{c}</Badge>)}
                                            </div>
                                        ) : <p className="font-medium">None</p>}
                                    </ProfileInfoRow>
                                    <div className="md:col-span-2">
                                    <ProfileInfoRow icon={Siren} label="Allergies">
                                        {formData.allergies && formData.allergies.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {formData.allergies.map(a => <Badge key={a} variant="destructive" className="bg-destructive/10 text-destructive-foreground border-destructive/20 capitalize">{a}</Badge>)}
                                            </div>
                                        ) : <p className="font-medium">None</p>}
                                    </ProfileInfoRow>
                                    </div>
                                </div>
                                <Separator />
                                <h3 className="text-lg font-semibold border-b pb-2 pt-2">Emergency Contacts</h3>
                                {formData.emergencyContacts && formData.emergencyContacts.length > 0 ? (
                                    <div className="space-y-2">
                                        {formData.emergencyContacts.map(contact => (
                                            <div key={contact.id} className="flex items-center justify-between p-2 rounded-md border bg-background-softer">
                                                <div>
                                                    <p className="font-semibold">{contact.name || 'N/A'}</p>
                                                    <p className="text-sm text-muted-foreground">{contact.relation}</p>
                                                    <p className="text-sm text-muted-foreground">{contact.contactNumber || `Health ID: ${contact.healthId}`}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No emergency contacts added.</p>}
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
