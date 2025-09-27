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
import { Loader2 } from "lucide-react";

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

    const handleAnalyze = async () => {
        if (!reportText || !reportName || !user || !displayUser) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please fill out all fields.',
            });
            return;
        }

        setIsAnalyzing(true);
        try {
            // 1. Extract structured data
            const extractedDataResult = await extractMedicalData({ reportText });

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
                storagePath: 'simulated_path/' + reportName.replace(/ /g, '_') // In a real app, this would be a GCS path
            });

            toast({
                title: 'Analysis Complete',
                description: 'Report has been successfully analyzed and saved.',
            });

            resetAndClose();

        } catch (error: any) {
            console.error("Analysis failed:", error);
            let description = 'Could not analyze the report. Please check the content and try again.';
            if (error.message && error.message.includes('Service Unavailable')) {
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
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Upload Medical Report</DialogTitle>
                    <DialogDescription>
                        Paste the text from your medical report below for AI analysis.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="name">Report Name</Label>
                        <Input id="name" value={reportName} onChange={e => setReportName(e.target.value)} placeholder="e.g., Annual Bloodwork Results" />
                    </div>
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
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={resetAndClose} disabled={isAnalyzing}>Cancel</Button>
                    <Button onClick={handleAnalyze} disabled={!reportText || !reportName || isAnalyzing}>
                        {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Report'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
