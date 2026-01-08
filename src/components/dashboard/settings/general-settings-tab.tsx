'use client'

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Building, Hash, MapPin, Phone, Image as ImageIcon, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

type FacilityImage = {
  id: string;
  url: string;
};

const initialImages: FacilityImage[] = [
  { id: 'img1', url: 'https://picsum.photos/seed/hospital1/600/400' },
  { id: 'img2', url: 'https://picsum.photos/seed/hospital2/600/400' },
];

export function GeneralSettingsTab() {
  const [mobileNumber, setMobileNumber] = useState('+8801234567890');
  const [images, setImages] = useState<FacilityImage[]>(initialImages);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveChanges = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Settings Saved",
      description: "Your general settings have been updated successfully.",
    });
    setIsSaving(false);
  };
  
  const handleAddImage = () => {
    const newImage: FacilityImage = {
        id: `img${Date.now()}`,
        url: `https://picsum.photos/seed/${Math.random()}/600/400`
    };
    setImages(prev => [...prev, newImage]);
  }

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }

  return (
    <div className="space-y-8">
      {/* Organization Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Organization Details</h3>
        <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="orgName" className="flex items-center gap-2"><Building className="h-4 w-4" /> Organization Name</Label>
            <Input id="orgName" value="Digital Health Clinic" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regNumber" className="flex items-center gap-2"><Hash className="h-4 w-4" /> Registration Number</Label>
            <Input id="regNumber" value="DH-123456789" disabled />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</Label>
            <Input id="address" value="123 Health St, Medical Road, Dhaka, Bangladesh" disabled />
          </div>
           <div className="space-y-2">
            <Label htmlFor="mobileNumber" className="flex items-center gap-2"><Phone className="h-4 w-4" /> Mobile Number</Label>
            <Input id="mobileNumber" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
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
                {images.map(image => (
                    <div key={image.id} className="relative group">
                        <Image
                            data-ai-hint="hospital building"
                            src={image.url}
                            alt="Facility Image"
                            width={600}
                            height={400}
                            className="rounded-md object-cover aspect-video"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(image.id)}
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
      
      <Button onClick={handleSaveChanges} disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save All Changes
      </Button>
    </div>
  );
}
