
'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building, Hash, MapPin, Phone, Image as ImageIcon, PlusCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore, useMemoFirebase, updateDocument } from '@/firebase';
import { doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Organization } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

export function GeneralSettingsTab() {
  const { user, loading: userLoading, hasRole } = useAuth();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const adminOrgId = searchParams.get('orgId');
  const isAdminView = hasRole('admin') && !!adminOrgId;
  const orgId = isAdminView ? adminOrgId : user?.organizationId;

  const orgDocRef = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return doc(firestore, 'organizations', orgId);
  }, [firestore, orgId]);

  const { data: organization, isLoading: orgLoading } = useDoc<Organization>(orgDocRef);
  
  const isLoading = userLoading || orgLoading;

  const handleAddImage = async () => {
    if (!firestore || !organization) return;
    const newImageUrl = `https://picsum.photos/seed/${Math.random()}/600/400`;
    const orgRef = doc(firestore, 'organizations', organization.id);
    await updateDocument(orgRef, {
        facilityImages: arrayUnion(newImageUrl)
    });
  }

  const handleRemoveImage = async (imageUrl: string) => {
    if (!firestore || !organization) return;
    const orgRef = doc(firestore, 'organizations', organization.id);
    await updateDocument(orgRef, {
        facilityImages: arrayRemove(imageUrl)
    });
  }

  const images = organization?.facilityImages || [];

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Organization Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Organization Details</h3>
        <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="orgName" className="flex items-center gap-2"><Building className="h-4 w-4" /> Organization Name</Label>
            <Input id="orgName" value={organization?.name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regNumber" className="flex items-center gap-2"><Hash className="h-4 w-4" /> Registration Number</Label>
            <Input id="regNumber" value={organization?.registrationNumber || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tin" className="flex items-center gap-2"><Hash className="h-4 w-4" /> TIN</Label>
            <Input id="tin" value={organization?.tin || ''} disabled />
          </div>
           <div className="space-y-2">
            <Label htmlFor="mobileNumber" className="flex items-center gap-2"><Phone className="h-4 w-4" /> Mobile Number</Label>
            <Input id="mobileNumber" value={organization?.mobileNumber || ''} disabled />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</Label>
            <Input id="address" value={organization?.address || ''} disabled />
          </div>
        </div>
      </div>
      
      <Separator />

      {/* Facility Images */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Facility Pictures</h3>
             <Button variant="outline" size="sm" onClick={handleAddImage}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Image
             </Button>
        </div>
        <div className="p-4 border rounded-lg">
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                    <div key={index} className="relative group">
                        <Image
                            src={image}
                            alt="Facility Image"
                            width={600}
                            height={400}
                            className="rounded-md object-cover aspect-video"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(image)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
                <p>No facility images have been added yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
