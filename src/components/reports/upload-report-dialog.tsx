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
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { extractMedicalData, ExtractMedicalDataOutput } from "@/ai/flows/extract-medical-data";
import { provideDecisionSupport, ProvideDecisionSupportOutput } from "@/ai/flows/provide-decision-support";
import { ref, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { FileText, Loader2, UploadCloud, CheckCircle, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card } from "../ui/card";
import { Checkbox } from "../ui/checkbox";

type DialogStep = 'upload' | 'analyzing' | 'results';
type FullAnalysisResult = ExtractMedicalDataOutput & ProvideDecisionSupportOutput;

interface UploadReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UploadReportDialog({ open, onOpenChange }: UploadReportDialogProps) {
    const { user, displayUser } = useAuth();
    const { toast } = useToast();
    const [step, setStep] = useState<DialogStep>('upload');
    const [reportText, setReportText] = useState("");
    const [reportName, setReportName] = useState("");
    const [uploadType, setUploadType] = useState('text');
    const [file, setFile] = useState<File | null>(null);
    const [analysisResult, setAnalysisResult] = useState<FullAnalysisResult | null>(null);
    const [saveToDb, setSaveToDb] = useState(true);

     useEffect(() => {
        // Reset state when dialog is closed
        if (!open) {
            resetState();
        }
    }, [open]);

    const resetState = () => {
        setStep('upload');
        setReportText("");
        setReportName("");
        setFile(null);
        setUploadType('text');
        setAnalysisResult(null);
        setSaveToDb(true);
    };

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

        setStep('analyzing');
        try {
            let dataPayload: { reportText?: string; reportDataUri?: string } = {};

            if (uploadType === 'file' && file) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async (e) => {
                    const reportDataUri = e.target?.result as string;
                    if (!reportDataUri) throw new Error("Could not read file.");
                    dataPayload = { reportDataUri };
                    await processAnalysis(dataPayload);
                };
                reader.onerror = (error) => { throw error; };
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
            
            setAnalysisResult({ ...extractedDataResult, ...decisionSupportResult });
            setStep('results');

        } catch(error) {
            handleAnalysisError(error);
        }
    }

     const handleSaveAndClose = async () => {
        if (!analysisResult || !user) return;

        if (saveToDb) {
            setStep('analyzing'); // Show spinner while saving
             try {
                const newReportRef = push(ref(db, 'reports'));
                await set(newReportRef, {
                    name: reportName,
                    patientId: user!.uid,
                    uploadedAt: new Date().toISOString(),
                    ...analysisResult,
                    storagePath: 'simulated_path/' + reportName.replace(/ /g, '_') 
                });

                toast({
                    title: 'Analysis Saved',
                    description: 'Report has been successfully saved to your account.',
                });
             } catch (dbError) {
                 console.error("Failed to save to database:", dbError);
                 toast({
                    variant: 'destructive',
                    title: 'Database Error',
                    description: 'Could not save the analysis. Please try again.',
                 });
                 setStep('results'); // Go back to results step
                 return;
             }
        }
        resetState(); // Reset and close dialog
        onOpenChange(false);
    };

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
        setStep('upload');
    }

    const renderStepContent = () => {
        switch(step) {
            case 'analyzing':
                 return (
                    <div className="flex flex-col items-center justify-center h-48 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Analyzing your report...</p>
                    </div>
                )
            case 'results':
                const abnormalCount = analysisResult?.extractedValues.filter(v => v.status === 'abnormal').length || 0;
                 return (
                    <div className="space-y-4">
                         <div className="p-4 rounded-lg bg-secondary">
                            <h3 className="font-semibold text-lg mb-2">Analysis Complete</h3>
                             <div className="flex items-center gap-4 mt-2">
                               {abnormalCount > 0 ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                               <p>{abnormalCount} abnormal result(s) found.</p>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                                <FileText className="h-5 w-5 text-primary"/>
                                <p>{analysisResult?.suggestedFollowUps?.length || 0} follow-up(s) suggested.</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-md">
                            <Checkbox id="save-db" checked={saveToDb} onCheckedChange={(checked) => setSaveToDb(Boolean(checked))} />
                            <Label htmlFor="save-db" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Save this analysis to my account.
                            </Label>
                        </div>
                    </div>
                )
            case 'upload':
            default:
                return (
                    <div className="grid gap-4">
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
                )
        }
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                         {step === 'results' ? 'Analysis Results' : 'Upload Medical Report'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'results' ? 'Review the summary and choose to save or discard.' : 'Upload a DOCX/PDF file or paste text for AI analysis.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {renderStepContent()}
                </div>
                <DialogFooter>
                    {step === 'upload' && (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleAnalyze} disabled={!reportName || (uploadType === 'text' && !reportText) || (uploadType === 'file' && !file)}>
                                Analyze Report
                            </Button>
                        </>
                    )}
                     {step === 'analyzing' && (
                        <Button variant="outline" onClick={resetState} >Cancel</Button>
                     )}
                    {step === 'results' && (
                        <>
                            <Button variant="outline" onClick={resetState}>Discard</Button>
                            <Button onClick={handleSaveAndClose} disabled={!analysisResult}>
                                {saveToDb ? 'Save & Close' : 'Close'}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
