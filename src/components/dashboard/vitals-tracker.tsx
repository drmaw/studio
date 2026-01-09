

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';

type VitalsTrackerProps = {
  vitalsData: Vitals[];
  currentUserRole: Role;
};

const chartConfig = {
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
  rbs: {
    label: "RBS",
    color: "hsl(var(--chart-4))",
  },
  sCreatinine: {
    label: "S.Creatinine",
    color: "hsl(var(--chart-5))",
  }
};

function VitalsInput({ onAdd, submitting }: { onAdd: (vital: Partial<Vitals>) => void, submitting: boolean }) {
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [weight, setWeight] = useState('');
  const [rbs, setRbs] = useState('');
  const [sCreatinine, setSCreatinine] = useState('');

  return (
    <Tabs defaultValue="rbs">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="rbs">RBS</TabsTrigger>
        <TabsTrigger value="bp">BP</TabsTrigger>
        <TabsTrigger value="pulse">Pulse</TabsTrigger>
        <TabsTrigger value="weight">Weight</TabsTrigger>
        <TabsTrigger value="sCreatinine">S.Creatinine</TabsTrigger>
      </TabsList>
       <TabsContent value="rbs">
        <div className="flex gap-2 items-end">
          <Input className="flex-1" placeholder="RBS (mmol/L)" value={rbs} onChange={e => setRbs(e.target.value)} type="number" />
          <Button onClick={() => { onAdd({ rbs: parseFloat(rbs) }); setRbs(''); }} disabled={submitting || !rbs}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
        </div>
      </TabsContent>
      <TabsContent value="bp">
        <div className="flex gap-2 items-end">
          <div className="grid grid-cols-2 gap-2 flex-1">
            <Input placeholder="Systolic (e.g. 120)" value={bpSystolic} onChange={e => setBpSystolic(e.target.value)} type="number" />
            <Input placeholder="Diastolic (e.g. 80)" value={bpDiastolic} onChange={e => setBpDiastolic(e.target.value)} type="number" />
          </div>
          <Button onClick={() => { onAdd({ bpSystolic: parseInt(bpSystolic), bpDiastolic: parseInt(bpDiastolic) }); setBpSystolic(''); setBpDiastolic(''); }} disabled={submitting || !bpSystolic || !bpDiastolic}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
        </div>
      </TabsContent>
       <TabsContent value="pulse">
        <div className="flex gap-2 items-end">
          <Input className="flex-1" placeholder="Pulse (bpm)" value={pulse} onChange={e => setPulse(e.target.value)} type="number" />
          <Button onClick={() => { onAdd({ pulse: parseInt(pulse) }); setPulse(''); }} disabled={submitting || !pulse}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
        </div>
      </TabsContent>
      <TabsContent value="weight">
         <div className="flex gap-2 items-end">
          <Input className="flex-1" placeholder="Weight (kg)" value={weight} onChange={e => setWeight(e.target.value)} type="number" />
          <Button onClick={() => { onAdd({ weight: parseFloat(weight) }); setWeight(''); }} disabled={submitting || !weight}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
        </div>
      </TabsContent>
      <TabsContent value="sCreatinine">
         <div className="flex gap-2 items-end">
          <Input className="flex-1" placeholder="S.Creatinine (mg/dL)" value={sCreatinine} onChange={e => setSCreatinine(e.target.value)} type="number" />
          <Button onClick={() => { onAdd({ sCreatinine: parseFloat(sCreatinine) }); setSCreatinine(''); }} disabled={submitting || !sCreatinine}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}


export function VitalsTracker({ vitalsData, currentUserRole }: VitalsTrackerProps) {
  const [vitals, setVitals] = useState<Vitals[]>(vitalsData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formattedData = vitals.map(v => ({
    ...v,
    name: format(parseISO(v.date), 'dd MMM'),
    bp: v.bpSystolic ? `${v.bpSystolic}/${v.bpDiastolic}`: null,
  }));

  const handleAddVitals = async (newVitalData: Partial<Vitals>) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newVital: Vitals = {
      id: `v${Date.now()}`,
      date: new Date().toISOString(),
      bpSystolic: newVitalData.bpSystolic ?? null,
      bpDiastolic: newVitalData.bpDiastolic ?? null,
      pulse: newVitalData.pulse ?? null,
      weight: newVitalData.weight ?? null,
      rbs: newVitalData.rbs ?? null,
      sCreatinine: newVitalData.sCreatinine ?? null,
    };
    
    setVitals(prev => [newVital, ...prev]);
    
    toast({
      title: "Vitals Logged",
      description: "Your latest health vitals have been recorded.",
    });

    setIsSubmitting(false);
  };
  
  const renderChart = (dataKey: "bpSystolic" | "pulse" | "weight" | "rbs" | "sCreatinine", label: string, color: string) => (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={formattedData.slice().reverse()}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} />
          <Tooltip
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))'
            }}
          />
          <Legend />
          <Line type="monotone" dataKey={dataKey} name={label} stroke={color} strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
          {dataKey === 'bpSystolic' && <Line type="monotone" dataKey="bpDiastolic" name="Diastolic" stroke={color} strokeOpacity={0.5} />}
        </LineChart>
      </ResponsiveContainer>
  );

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
        <Tabs defaultValue="rbs">
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
                <h4 className="font-medium text-center">Log New Vitals</h4>
                {isSubmitting ? 
                  <div className="flex justify-center items-center h-10">
                    <Loader2 className="animate-spin" />
                  </div>
                  :
                  <VitalsInput onAdd={handleAddVitals} submitting={isSubmitting} />
                }
            </div>
        )}

        <div className="space-y-2">
            <h4 className="font-medium">History</h4>
            <ScrollArea className="h-64 border rounded-md bg-background">
                <Table>
                    <TableHeader className="sticky top-0 bg-secondary">
                        <TableRow>
                            <TableHead className="w-1/3">Date</TableHead>
                            <TableHead>BP (Sys/Dia)</TableHead>
                            <TableHead>Pulse</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead>RBS</TableHead>
                            <TableHead>S.Creatinine</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {formattedData.map(v => (
                            <TableRow key={v.id}>
                                <TableCell className="font-medium">{format(parseISO(v.date), 'dd MMM yyyy, hh:mm a')}</TableCell>
                                <TableCell>{v.bp ?? 'N/A'}</TableCell>
                                <TableCell>{v.pulse ?? 'N/A'}</TableCell>
                                <TableCell>{v.weight ?? 'N/A'}</TableCell>
                                <TableCell>{v.rbs ?? 'N/A'}</TableCell>
                                <TableCell>{v.sCreatinine ?? 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
