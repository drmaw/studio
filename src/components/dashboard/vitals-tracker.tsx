
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { PlusCircle, Loader2, HeartPulse, Droplet, Weight, Activity, Beaker } from 'lucide-react';
import type { Role, Vitals } from '@/lib/definitions';
import { useFirestore, addDocument } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FormattedDate } from '../shared/formatted-date';


type VitalsTrackerProps = {
  vitalsData: Vitals[];
  currentUserRole: Role;
  patientId: string;
  organizationId: string;
};

const chartConfig = {
  rbs: {
    label: "RBS",
    color: "hsl(var(--chart-4))",
  },
  bp: {
    label: "BP",
    color: "hsl(var(--chart-1))",
  },
  pulse: {
    label: "Pulse",
    color: "hsl(var(--chart-2))",
  },
  weight: {
    label: "Weight",
    color: "hsl(var(--chart-3))",
  },
  sCreatinine: {
    label: "S.Creatinine",
    color: "hsl(var(--chart-5))",
  }
};

type VitalKey = 'rbs' | 'bp' | 'pulse' | 'weight' | 'sCreatinine';

export function VitalsTracker({ vitalsData, currentUserRole, patientId, organizationId }: VitalsTrackerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState<VitalKey>('rbs');

  // State for each input
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [weight, setWeight] = useState('');
  const [rbs, setRbs] = useState('');
  const [sCreatinine, setSCreatinine] = useState('');


  const formattedData = vitalsData.map(v => ({
    ...v,
    name: format(parseISO(v.date), 'dd-MM'),
  })).slice().reverse();

  const handleAddVitals = (newVitalData: Partial<Omit<Vitals, 'id' | 'patientId' | 'organizationId' | 'date' | 'createdAt'>>) => {
    if (!patientId || !firestore) return;

    if (Object.values(newVitalData).every(val => val === null || val === undefined || isNaN(val as number))) {
        toast({
            variant: "destructive",
            title: "No data entered",
            description: "Please enter a value for the vital.",
        });
        return;
    }

    setIsSubmitting(true);
    
    const vitalsRef = collection(firestore, 'patients', patientId, 'vitals');
    const newVital = {
        patientId,
        organizationId,
        date: new Date().toISOString(),
        bpSystolic: newVitalData.bpSystolic ?? null,
        bpDiastolic: newVitalData.bpDiastolic ?? null,
        pulse: newVitalData.pulse ?? null,
        weight: newVitalData.weight ?? null,
        rbs: newVitalData.rbs ?? null,
        sCreatinine: newVitalData.sCreatinine ?? null,
        createdAt: serverTimestamp()
    };
    
    addDocument(vitalsRef, newVital, (docRef) => {
        if (docRef) {
            toast({
                title: "Vitals Logged",
                description: "Your latest health vitals have been recorded.",
            });

            setBpSystolic('');
            setBpDiastolic('');
            setPulse('');
            setWeight('');
            setRbs('');
            setSCreatinine('');
        }
        setIsSubmitting(false);
    });
  };

  const renderInput = () => {
    if (isSubmitting) {
        return (
            <div className="flex justify-center items-center h-10">
                <Loader2 className="animate-spin" />
            </div>
        );
    }
    
    switch (activeTab) {
        case 'rbs':
            return (
                <div className="flex gap-2 items-end">
                    <Input className="flex-1" placeholder="RBS (mmol/L)" value={rbs} onChange={e => setRbs(e.target.value)} type="number" />
                    <Button onClick={() => handleAddVitals({ rbs: parseFloat(rbs) })} disabled={isSubmitting || !rbs}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                </div>
            );
        case 'bp':
            return (
                <div className="flex gap-2 items-end">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                        <Input placeholder="Systolic (e.g. 120)" value={bpSystolic} onChange={e => setBpSystolic(e.target.value)} type="number" />
                        <Input placeholder="Diastolic (e.g. 80)" value={bpDiastolic} onChange={e => setBpDiastolic(e.target.value)} type="number" />
                    </div>
                    <Button onClick={() => handleAddVitals({ bpSystolic: parseInt(bpSystolic), bpDiastolic: parseInt(bpDiastolic) })} disabled={isSubmitting || !bpSystolic || !bpDiastolic}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                </div>
            );
        case 'pulse':
            return (
                 <div className="flex gap-2 items-end">
                    <Input className="flex-1" placeholder="Pulse (bpm)" value={pulse} onChange={e => setPulse(e.target.value)} type="number" />
                    <Button onClick={() => handleAddVitals({ pulse: parseInt(pulse) })} disabled={isSubmitting || !pulse}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                </div>
            );
        case 'weight':
             return (
                 <div className="flex gap-2 items-end">
                    <Input className="flex-1" placeholder="Weight (kg)" value={weight} onChange={e => setWeight(e.target.value)} type="number" />
                    <Button onClick={() => handleAddVitals({ weight: parseFloat(weight) })} disabled={isSubmitting || !weight}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                </div>
            );
        case 'sCreatinine':
            return (
                 <div className="flex gap-2 items-end">
                    <Input className="flex-1" placeholder="S.Creatinine (mg/dL)" value={sCreatinine} onChange={e => setSCreatinine(e.target.value)} type="number" />
                    <Button onClick={() => handleAddVitals({ sCreatinine: parseFloat(sCreatinine) })} disabled={isSubmitting || !sCreatinine}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                </div>
            );
        default:
            return null;
    }
  }

  const renderHistoryTable = () => {
    let filteredHistory: Vitals[] = [];
    let tableHead: React.ReactNode = null;

    switch (activeTab) {
        case 'rbs':
            filteredHistory = vitalsData.filter(v => v.rbs !== null);
            tableHead = <TableHead>RBS (mmol/L)</TableHead>;
            break;
        case 'bp':
            filteredHistory = vitalsData.filter(v => v.bpSystolic !== null && v.bpDiastolic !== null);
            tableHead = <><TableHead>Systolic</TableHead><TableHead>Diastolic</TableHead></>;
            break;
        case 'pulse':
            filteredHistory = vitalsData.filter(v => v.pulse !== null);
            tableHead = <TableHead>Pulse (bpm)</TableHead>;
            break;
        case 'weight':
            filteredHistory = vitalsData.filter(v => v.weight !== null);
            tableHead = <TableHead>Weight (kg)</TableHead>;
            break;
        case 'sCreatinine':
            filteredHistory = vitalsData.filter(v => v.sCreatinine !== null);
            tableHead = <TableHead>S.Creatinine (mg/dL)</TableHead>;
            break;
    }
    
    const renderTableCell = (vital: Vitals) => {
        switch(activeTab) {
            case 'rbs': return <TableCell>{vital.rbs}</TableCell>
            case 'bp': return <><TableCell>{vital.bpSystolic}</TableCell><TableCell>{vital.bpDiastolic}</TableCell></>
            case 'pulse': return <TableCell>{vital.pulse}</TableCell>
            case 'weight': return <TableCell>{vital.weight}</TableCell>
            case 'sCreatinine': return <TableCell>{vital.sCreatinine}</TableCell>
            default: return null;
        }
    }

    return (
        <div className='mt-6 space-y-2'>
             <h4 className="font-medium text-center">History for {chartConfig[activeTab].label}</h4>
             <div className="border rounded-md max-h-60 overflow-y-auto">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            {tableHead}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map(vital => (
                                <TableRow key={vital.id}>
                                    <TableCell><FormattedDate date={vital.date} formatString="dd-MM-yyyy, hh:mm a" /></TableCell>
                                    {renderTableCell(vital)}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={activeTab === 'bp' ? 3 : 2} className="text-center">No history for this vital.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
             </div>
        </div>
    );
  }
  
  const renderChart = (dataKey: "bpSystolic" | "pulse" | "weight" | "rbs" | "sCreatinine", label: string, color: string) => {
      const chartData = formattedData.filter(d => d[dataKey] !== null && d[dataKey] !== undefined);
      return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))'
                }}
            />
            <Legend />
            <Line type="monotone" dataKey={dataKey} name={label} stroke={color} strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} connectNulls />
            {dataKey === 'bpSystolic' && <Line type="monotone" dataKey="bpDiastolic" name="Diastolic" stroke={color} strokeOpacity={0.5} connectNulls />}
            </LineChart>
        </ResponsiveContainer>
    )};

  return (
    <Card className="bg-background-soft">
      <CardHeader>
        <CardTitle>Vitals Tracking</CardTitle>
        <CardDescription>
            {currentUserRole === 'patient' 
                ? "Log and monitor your health metrics over time." 
                : "Patient's self-reported health metrics."
            }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="rbs" value={activeTab} onValueChange={(value) => setActiveTab(value as VitalKey)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="rbs"><Droplet className="mr-2 h-4 w-4 hidden sm:inline" />RBS</TabsTrigger>
            <TabsTrigger value="bp"><HeartPulse className="mr-2 h-4 w-4 hidden sm:inline" />BP</TabsTrigger>
            <TabsTrigger value="pulse"><Activity className="mr-2 h-4 w-4 hidden sm:inline" />Pulse</TabsTrigger>
            <TabsTrigger value="weight"><Weight className="mr-2 h-4 w-4 hidden sm:inline" />Weight</TabsTrigger>
            <TabsTrigger value="sCreatinine"><Beaker className="mr-2 h-4 w-4 hidden sm:inline" />S.Creatinine</TabsTrigger>
          </TabsList>
          <TabsContent value="rbs" className="mt-4">{renderChart('rbs', "RBS (mmol/L)", chartConfig.rbs.color)}</TabsContent>
          <TabsContent value="bp" className="mt-4">{renderChart('bpSystolic', "Systolic BP", chartConfig.bp.color)}</TabsContent>
          <TabsContent value="pulse" className="mt-4">{renderChart('pulse', "Pulse (bpm)", chartConfig.pulse.color)}</TabsContent>
          <TabsContent value="weight" className="mt-4">{renderChart('weight', "Weight (kg)", chartConfig.weight.color)}</TabsContent>
          <TabsContent value="sCreatinine" className="mt-4">{renderChart('sCreatinine', "S.Creatinine (mg/dL)", chartConfig.sCreatinine.color)}</TabsContent>
        </Tabs>
        
        {currentUserRole === 'patient' && (
             <div className="space-y-4 p-4 border rounded-lg bg-background">
                <h4 className="font-medium text-center">Log New {chartConfig[activeTab].label}</h4>
                {renderInput()}
            </div>
        )}
        {renderHistoryTable()}
      </CardContent>
    </Card>
  )
}
