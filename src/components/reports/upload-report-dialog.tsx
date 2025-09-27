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
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card } from "../ui/card";

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
    const [uploadType, setUploadType] = useState('text');
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setReportName(selectedFile.name.replace(/\.[^/.]+$/, ""));
        }
    };
    
    const handleAnalyze = async () => {
        if (!reportName || !user || !displayUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a name for the report.' });
            return;
        }
        
        if (uploadType === 'text' && !reportText) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please paste the report text.' });
            return;
        }

        if (uploadType === 'file' && !file) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a file to upload.' });
            return;
        }

        setIsAnalyzing(true);
        try {
            let dataPayload: { reportText?: string; reportDataUri?: string } = {};

            if (uploadType === 'file' && file) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async (e) => {
                    const reportDataUri = e.target?.result as string;
                    if (!reportDataUri) {
                        throw new Error("Could not read file.");
                    }
                    dataPayload = { reportDataUri };
                    await processAnalysis(dataPayload);
                };
                reader.onerror = (error) => {
                    throw error;
                }
            } else {
                dataPayload = { reportText };
                await processAnalysis(dataPayload);
            }

        } catch (error: any) {
            handleAnalysisError(error);
        }
    };
    
    const processAnalysis = async (dataPayload: { reportText?: string; reportDataUri?: string }) => {
        try {
            // 1. Extract structured data
            const extractedDataResult = await extractMedicalData(dataPayload);

            // 2. Get decision support based on extracted data
            const patientInfo = `Patient Age: ${displayUser?.profile?.dob ? new Date().getFullYear() - new Date(displayUser.profile.dob).getFullYear() : 'N/A'}, Sex: ${displayUser?.profile?.sex || 'N/A'}`;
            const decisionSupportResult = await provideDecisionSupport({
                extractedValues: extractedDataResult.extractedValues,
                patientInfo: patientInfo,
            });

            // 3. Save everything to Realtime Database
            const newReportRef = push(ref(db, 'reports'));

            await set(newReportRef, {
                name: reportName,
                patientId: user!.uid,
                uploadedAt: new Date().toISOString(),
                ...extractedDataResult,
                ...decisionSupportResult,
                storagePath: 'simulated_path/' + reportName.replace(/ /g, '_') 
            });

            toast({
                title: 'Analysis Complete',
                description: 'Report has been successfully analyzed and saved.',
            });

            resetAndClose();
        } catch(error) {
            handleAnalysisError(error);
        } finally {
            setIsAnalyzing(false);
        }
    }
    
    const handleAnalysisError = (error: any) => {
        console.error("Analysis failed:", error);
        let description = 'Could not analyze the report. Please check the content and try again.';
        if (error.message && (error.message.includes('Service Unavailable') || error.message.includes('503'))) {
            description = 'The analysis service is temporarily unavailable. Please try again in a few moments.';
        } else if (error.message && error.message.includes('Unsupported MIME type')) {
            description = 'The uploaded file format is not supported. Please use .docx or .pdf files, or paste the text directly.'
        }
        toast({
            variant: 'destructive',
            title: 'Analysis Failed',
            description: description,
        });
        setIsAnalyzing(false);
    }

    const resetAndClose = () => {
        setReportText("");
        setReportName("");
        setFile(null);
        setUploadType('text');
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Upload Medical Report</DialogTitle>
                    <DialogDescription>
                        Upload a DOCX/PDF file or paste the text from your report for AI analysis.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="name">Report Name</Label>
                        <Input id="name" value={reportName} onChange={e => setReportName(e.target.value)} placeholder="e.g., Annual Bloodwork Results" />
                    </div>
                    
                    <Tabs value={uploadType} onValueChange={setUploadType} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="text">Paste Text</TabsTrigger>
                            <TabsTrigger value="file">Upload File</TabsTrigger>
                        </TabsList>
                        <TabsContent value="text" className="mt-4">
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
                        <TabsContent value="file" className="mt-4">
                             <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="picture">Report File</Label>
                                {file ? (
                                    <Card className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-6 w-6 text-primary"/>
                                            <div>
                                                <p className="text-sm font-medium">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Remove</Button>
                                    </Card>
                                ) : (
                                    <div className="w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground relative">
                                        <div className="text-center">
                                            <UploadCloud className="mx-auto h-8 w-8 mb-2" />
                                            <p>Click to browse or drag & drop</p>
                                            <p className="text-xs mt-1">.docx or .pdf</p>
                                        </div>
                                        <Input id="picture" type="file" accept=".pdf,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={resetAndClose} disabled={isAnalyzing}>Cancel</Button>
                    <Button onClick={handleAnalyze} disabled={!reportName || (uploadType === 'text' && !reportText) || (uploadType === 'file' && !file) || isAnalyzing}>
                        {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Report'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
