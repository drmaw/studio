'use client'

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, PlusCircle, TestTube, Bed, StethoscopeIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FeeItem = {
    id: string;
    name: string;
    cost: number;
};

const initialInvestigations: FeeItem[] = [
    { id: 'inv-1', name: 'Complete Blood Count (CBC)', cost: 500 },
    { id: 'inv-2', name: 'X-Ray Chest PA view', cost: 700 },
];

const initialAdmissionFees: FeeItem[] = [
    { id: 'adm-1', name: 'General Ward Admission', cost: 1500 },
    { id: 'adm-2', name: 'Private Cabin Admission', cost: 5000 },
];

const initialDoctorFees: FeeItem[] = [
    { id: 'doc-1', name: 'General Consultation', cost: 800 },
    { id: 'doc-2', name: 'Specialist Consultation', cost: 1200 },
];

function FeeCategory({ 
    title, 
    icon, 
    items, 
    setItems,
    placeholder
}: { 
    title: string; 
    icon: React.ReactNode; 
    items: FeeItem[]; 
    setItems: React.Dispatch<React.SetStateAction<FeeItem[]>>;
    placeholder: string;
}) {
    const { toast } = useToast();
    const [newItemName, setNewItemName] = useState('');
    const [newItemCost, setNewItemCost] = useState('');

    const handleAddItem = () => {
        const cost = parseFloat(newItemCost);
        if (!newItemName || isNaN(cost) || cost <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Input',
                description: 'Please enter a valid item name and a positive cost.',
            });
            return;
        }

        const newItem: FeeItem = {
            id: `${title.toLowerCase()}-${Date.now()}`,
            name: newItemName,
            cost: cost,
        };

        setItems(prev => [...prev, newItem]);
        setNewItemName('');
        setNewItemCost('');
        toast({
            title: 'Item Added',
            description: `${newItemName} has been added to ${title}.`,
        });
    };

    return (
        <AccordionItem value={title}>
            <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">{icon} {title}</div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead className="w-[150px] text-right">Cost (BDT)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right font-mono">{item.cost.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded-md">
                    <Input 
                        placeholder={placeholder}
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-1"
                    />
                    <div className="relative w-32">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="number"
                            placeholder="Cost"
                            value={newItemCost}
                            onChange={(e) => setNewItemCost(e.target.value)}
                            className="pl-7"
                        />
                    </div>
                    <Button onClick={handleAddItem} size="icon">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Add Item</span>
                    </Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

export function BillingFeesTab() {
    const [investigations, setInvestigations] = useState(initialInvestigations);
    const [admissionFees, setAdmissionFees] = useState(initialAdmissionFees);
    const [doctorFees, setDoctorFees] = useState(initialDoctorFees);

    return (
        <Accordion type="multiple" defaultValue={['Investigations']} className="w-full">
            <FeeCategory
                title="Investigations"
                icon={<TestTube className="h-5 w-5 text-primary" />}
                items={investigations}
                setItems={setInvestigations}
                placeholder="e.g. Lipid Profile"
            />
            <FeeCategory
                title="Patient Admission"
                icon={<Bed className="h-5 w-5 text-primary" />}
                items={admissionFees}
                setItems={setAdmissionFees}
                placeholder="e.g. ICU Admission (per day)"
            />
            <FeeCategory
                title="Doctor Visit Fees"
                icon={<StethoscopeIcon className="h-5 w-5 text-primary" />}
                items={doctorFees}
                setItems={setDoctorFees}
                placeholder="e.g. Follow-up Consultation"
            />
             <AccordionItem value="Surgical Procedures" disabled>
                <AccordionTrigger className="text-lg font-medium">
                    <div className="flex items-center gap-2 text-muted-foreground">Surgical Procedures (Coming Soon)</div>
                </AccordionTrigger>
            </AccordionItem>
        </Accordion>
    );
}
