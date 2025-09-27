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
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { analyzePrescription, AnalyzePrescriptionOutput } from "@/ai/flows/analyze-prescriptions";
import { ref, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { Loader2, UploadCloud, CheckCircle, AlertTriangle, Pill } from "lucide-react";
import Image from "next/image";
import { Checkbox } from "../ui/checkbox";

type DialogStep = 'upload' | 'analyzing' | 'results';

interface UploadPrescriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UploadPrescriptionDialog({ open, onOpenChange }: UploadPrescriptionDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [step, setStep] = useState<DialogStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState("");
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalyzePrescriptionOutput | null>(null);
    const [saveToDb, setSaveToDb] = useState(true);

    useEffect(() => {
        // Reset state when dialog is closed
        if (!open) {
            resetState();
        }
    }, [open]);

    const resetState = () => {
        setFile(null);
        setFilePreview(null);
        setFileName("");
        setStep('upload');
        setAnalysisResult(null);
        setSaveToDb(true);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name.replace(/\.[^/.]+$/, ""));
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleAnalyze = async () => {
        if (!file || !user) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please select a file to analyze.',
            });
            return;
        }

        setStep('analyzing');
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async (e) => {
                const prescriptionDataUri = e.target?.result as string;

                if (!prescriptionDataUri) {
                    throw new Error("Could not read file.");
                }

                const result = await analyzePrescription({ prescriptionDataUri });
                setAnalysisResult(result);
                setStep('results');
            };
            reader.onerror = (error) => {
                throw error;
            }

        } catch (error: any) {
            console.error("Analysis failed:", error);
            let description = 'Could not analyze the prescription. Please try again.';
            if (error.message && (error.message.includes('Service Unavailable') || error.message.includes('503'))) {
                description = 'The analysis service is temporarily unavailable. Please try again in a few moments.';
            }
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: description,
            });
            setStep('upload');
        }
    };

    const handleSaveAndClose = async () => {
        if (!analysisResult || !user) return;

        if (saveToDb) {
            try {
                const newPrescriptionRef = push(ref(db, 'prescriptions'));
                await set(newPrescriptionRef, {
                    name: fileName || "Untitled Prescription",
                    patientId: user.uid,
                    uploadedAt: new Date().toISOString(),
                    medicines: analysisResult.medicines,
                    interactions: analysisResult.interactions || [],
                    storagePath: 'simulated_path/' + file?.name
                });
                toast({
                    title: 'Analysis Saved',
                    description: 'Your prescription analysis has been saved to your records.',
                });
            } catch (dbError) {
                console.error("Failed to save to database:", dbError);
                toast({
                    variant: 'destructive',
                    title: 'Database Error',
                    description: 'Could not save the analysis. Please try again.',
                });
                return; // Don't close if save fails
            }
        }
        resetState(); // Reset and close dialog
        onOpenChange(false);
    };

    const renderStepContent = () => {
        switch (step) {
            case 'analyzing':
                return (
                    <div className="flex flex-col items-center justify-center h-48 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Analyzing your prescription...</p>
                    </div>
                )
            case 'results':
                const interactionCount = analysisResult?.interactions?.length || 0;
                return (
                    <div className="space-y-4">
                         <div className="p-4 rounded-lg bg-secondary">
                            <h3 className="font-semibold text-lg mb-2">Analysis Complete</h3>
                            <div className="flex items-center gap-4">
                               <Pill className="h-5 w-5 text-primary"/>
                                <p>{analysisResult?.medicines?.length || 0} medicine(s) identified.</p>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                               {interactionCount > 0 ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                               <p>{interactionCount} potential interaction(s) found.</p>
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
                            <Label htmlFor="picture">Prescription Image</Label>
                            <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground relative">
                                {filePreview ? (
                                    <Image src={filePreview} alt="Prescription preview" fill objectFit="contain" className="rounded-lg" />
                                ) : (
                                    <div className="text-center">
                                        <UploadCloud className="mx-auto h-8 w-8 mb-2" />
                                        <p>Click to browse or drag & drop</p>
                                    </div>
                                )}
                                <Input id="picture" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                            </div>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="name">Prescription Name</Label>
                            <Input id="name" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g., Post-surgery meds" />
                        </div>
                    </div>
                )
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'results' ? 'Analysis Results' : 'Upload Prescription'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'results' ? 'Review the summary and choose to save or discard.' : 'Upload an image of your prescription for AI analysis.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {renderStepContent()}
                </div>
                <DialogFooter>
                    {step === 'upload' && (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleAnalyze} disabled={!file}>
                                Analyze
                            </Button>
                        </>
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
