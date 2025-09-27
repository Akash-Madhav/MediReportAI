'use client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { extractMedicalData } from "@/ai/flows/extract-medical-data";
import { provideDecisionSupport } from "@/ai/flows/provide-decision-support";
import { ref, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { FileUp, Loader2, UploadCloud } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface UploadReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UploadReportDialog({ open, onOpenChange }: UploadReportDialogProps) {
    const { user, displayUser } = useAuth();
    const { toast } = useToast();
    const [reportText, setReportText] = useState("");
    const [reportName, setReportName] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileDataUri, setFileDataUri] = useState<string | null>(null);
    const [uploadMode, setUploadMode] = useState<'paste' | 'upload'>('paste');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!reportName) {
                setReportName(selectedFile.name.replace(/\.[^/.]+$/, ""));
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFileDataUri(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };


    const handleAnalyze = async () => {
        if (!reportName || !user || !displayUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a name for the report.' });
            return;
        }
        
        const analysisInput = uploadMode === 'paste' 
            ? { reportText, reportDataUri: undefined } 
            : { reportText: undefined, reportDataUri: fileDataUri };

        if (uploadMode === 'paste' && !reportText) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please paste the report text.' });
            return;
        }

        if (uploadMode === 'upload' && !file) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a file to upload.' });
            return;
        }


        setIsAnalyzing(true);
        try {
            // 1. Extract structured data
            const extractedDataResult = await extractMedicalData(analysisInput);

            // 2. Get decision support based on extracted data
            const patientInfo = `Patient Age: ${displayUser.profile?.dob ? new Date().getFullYear() - new Date(displayUser.profile.dob).getFullYear() : 'N/A'}, Sex: ${displayUser.profile?.sex || 'N/A'}`;
            const decisionSupportResult = await provideDecisionSupport({
                extractedValues: extractedDataResult.extractedValues,
                patientInfo: patientInfo,
            });

            // 3. Save everything to Realtime Database
            const newReportRef = push(ref(db, 'reports'));

            await set(newReportRef, {
                name: reportName,
                patientId: user.uid,
                uploadedAt: new Date().toISOString(),
                ...extractedDataResult,
                ...decisionSupportResult,
                storagePath: 'simulated_path/' + (file?.name || reportName.replace(/ /g, '_')) 
            });

            toast({
                title: 'Analysis Complete',
                description: 'Report has been successfully analyzed and saved.',
            });

            resetAndClose();

        } catch (error: any) {
            console.error("Analysis failed:", error);
            let description = 'Could not analyze the report. Please check the content and try again.';
            if (error.message && (error.message.includes('Service Unavailable') || error.message.includes('503'))) {
                description = 'The analysis service is temporarily unavailable. Please try again in a few moments.';
            }
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: description,
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetAndClose = () => {
        setReportText("");
        setReportName("");
        setFile(null);
        setFileDataUri(null);
        onOpenChange(false);
        setUploadMode('paste');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Upload Medical Report</DialogTitle>
                    <DialogDescription>
                        Paste text or upload a PDF/DOCX file for AI analysis.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="name">Report Name</Label>
                        <Input id="name" value={reportName} onChange={e => setReportName(e.target.value)} placeholder="e.g., Annual Bloodwork Results" />
                    </div>

                    <Tabs defaultValue="paste" onValueChange={(value) => setUploadMode(value as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="paste">Paste Text</TabsTrigger>
                            <TabsTrigger value="upload">Upload File</TabsTrigger>
                        </TabsList>
                        <TabsContent value="paste" className="mt-4">
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="report-text">Report Text</Label>
                                <Textarea
                                    id="report-text"
                                    value={reportText}
                                    onChange={e => setReportText(e.target.value)}
                                    placeholder="Paste the full text of your medical report here..."
                                    className="min-h-[250px]"
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="upload" className="mt-4">
                             <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="picture">Report File</Label>
                                <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground relative">
                                    {file ? (
                                        <div className="text-center">
                                            <FileUp className="mx-auto h-8 w-8 mb-2 text-primary"/>
                                            <p className="font-semibold">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <UploadCloud className="mx-auto h-8 w-8 mb-2" />
                                            <p>Click to browse or drag & drop</p>
                                            <p className="text-xs">PDF or DOCX</p>
                                        </div>
                                    )}
                                    <Input id="picture" type="file" accept=".pdf,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={resetAndClose} disabled={isAnalyzing}>Cancel</Button>
                    <Button onClick={handleAnalyze} disabled={!reportName || isAnalyzing}>
                        {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Report'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
