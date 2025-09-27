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
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { analyzePrescription } from "@/ai/flows/analyze-prescriptions";
import { ref, push } from "firebase/database";
import { db } from "@/lib/firebase";
import { Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";

interface UploadPrescriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UploadPrescriptionDialog({ open, onOpenChange }: UploadPrescriptionDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState("");
    const [filePreview, setFilePreview] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name.replace(/\.[^/.]+$/, "")); // Set default name without extension
            
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

        setIsAnalyzing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async (e) => {
                const prescriptionDataUri = e.target?.result as string;

                if (!prescriptionDataUri) {
                    throw new Error("Could not read file.");
                }

                // Call the Genkit flow
                const analysisResult = await analyzePrescription({ prescriptionDataUri });
                
                // Save to Realtime Database
                const prescriptionsRef = ref(db, 'prescriptions');
                const newPrescriptionRef = push(prescriptionsRef);
                
                await push(newPrescriptionRef, {
                    name: fileName || "Untitled Prescription",
                    patientId: user.uid,
                    uploadedAt: new Date().toISOString(),
                    medicines: analysisResult.medicines,
                    interactions: analysisResult.interactions || [],
                    storagePath: 'simulated_path/' + file.name // In a real app, this would be a GCS path
                });

                toast({
                    title: 'Analysis Complete',
                    description: 'Prescription has been successfully analyzed and saved.',
                });
                resetAndClose();
            };
            reader.onerror = (error) => {
                throw error;
            }

        } catch (error) {
            console.error("Analysis failed:", error);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'Could not analyze the prescription. Please try again.',
            });
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const resetAndClose = () => {
        setFile(null);
        setFilePreview(null);
        setFileName("");
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload Prescription</DialogTitle>
                    <DialogDescription>
                        Upload an image of your prescription for AI analysis.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="picture">Prescription Image</Label>
                        <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground relative">
                            {filePreview ? (
                                <Image src={filePreview} alt="Prescription preview" layout="fill" objectFit="contain" className="rounded-lg" />
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
                <DialogFooter>
                    <Button variant="outline" onClick={resetAndClose} disabled={isAnalyzing}>Cancel</Button>
                    <Button onClick={handleAnalyze} disabled={!file || isAnalyzing}>
                        {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
