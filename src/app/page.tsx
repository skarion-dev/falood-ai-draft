"use client";

import React, { useState, useRef } from 'react';
import { ResumeProvider } from '@/contexts/ResumeContext';
import { ResumeForm } from '@/components/form/ResumeForm';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Eye, EyeOff, Palette, Settings, AlertTriangle, Upload, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResume } from '@/contexts/ResumeContext';
import { exportResumeAsJSON, importResumeFromJSON } from '@/utils/resumeImportExport';
import { useToast } from '@/components/ui/use-toast';

const ResumeContent: React.FC = () => {
    const [showPreview, setShowPreview] = useState(true);
    const [activePanel, setActivePanel] = useState<'form' | 'customize' | 'settings'>('form');
    const [pageOverflow, setPageOverflow] = useState(false);
    const { state, exportResumeData, importResumeData } = useResume();
    const resumeRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        const checkOverflow = () => {
            const element = document.getElementById('resume-content');
            if (element) {
                const pageHeight = state.resumeData.pageFormat === 'a4' ? 297 * 3.779 : 11 * 96; // Convert to pixels
                const isOverflowing = element.scrollHeight > pageHeight * 1.1; // 10% tolerance
                setPageOverflow(isOverflowing);
            }
        };

        const timeoutId = setTimeout(checkOverflow, 500);
        return () => clearTimeout(timeoutId);
    }, [state.resumeData, state.resumeData.pageFormat]);

    const handleDownloadPDF = () => {
        window.print();
    };

    const handleExportJSON = () => {
        const success = exportResumeAsJSON(exportResumeData());
        if (success) {
            toast({
                title: "Resume Exported",
                description: "Your resume data has been saved as JSON file.",
            });
        } else {
            toast({
                title: "Export Failed",
                description: "There was an error exporting your resume.",
                variant: "destructive",
            });
        }
    };

    const handleImportJSON = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const resumeData = await importResumeFromJSON(file);
            importResumeData(resumeData);
            toast({
                title: "Resume Imported",
                description: "Your resume data has been loaded successfully.",
            });
        } catch (error) {
            toast({
                title: "Import Failed",
                description: "Invalid file format or corrupted data.",
                variant: "destructive",
            });
        }

        // Reset the input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-surface">
            <div className="container mx-auto px-4 py-6">
                {/* Page overflow warning */}
                {pageOverflow && (
                    <Alert className="mb-4 border-warning bg-warning/10 print:hidden">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Your resume content exceeds one page. Consider removing some content or using a more compact template for better ATS compatibility.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Mobile toggle buttons */}
                <div className="lg:hidden mb-4 flex gap-2 print:hidden">
                    <Button
                        variant={showPreview ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2"
                    >
                        {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">
                    {/* Form Panel */}
                    <div className={cn(
                        "w-full lg:w-[600px] h-[750px] bg-card rounded-xl shadow-lg overflow-hidden flex flex-col print:hidden",
                        "lg:block",
                        showPreview ? "hidden lg:flex" : "flex"
                    )}>
                        <div className="border-b border-border flex-shrink-0">
                            <div className="flex items-center">
                                <Button
                                    variant={activePanel === 'form' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setActivePanel('form')}
                                    className="rounded-none border-r border-border px-6 py-3"
                                >
                                    Content
                                </Button>
                                <Button
                                    variant={activePanel === 'customize' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setActivePanel('customize')}
                                    className="rounded-none border-r border-border px-6 py-3"
                                >
                                    <Palette className="w-4 h-4 mr-2" />
                                    Customize
                                </Button>
                                <Button
                                    variant={activePanel === 'settings' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setActivePanel('settings')}
                                    className="rounded-none px-6 py-3"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <ResumeForm activePanel={activePanel} />
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className={cn(
                        "w-full lg:w-[900px] h-[750px] bg-card rounded-xl shadow-lg overflow-hidden flex flex-col print:w-full print:h-auto print:shadow-none print:rounded-none print:block print:overflow-visible",
                        "lg:flex",
                        showPreview ? "flex" : "hidden lg:flex"
                    )}>
                        <div className="border-b border-border p-4 flex items-center justify-between flex-shrink-0 print:hidden">
                            <h2 className="text-lg font-semibold">Live Preview</h2>
                            <div className="flex items-center gap-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center gap-2 px-3 py-2"
                                    onClick={handleImportJSON}
                                >
                                    <Upload className="w-4 h-4" />
                                    Import
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center gap-2 px-3 py-2"
                                    onClick={handleExportJSON}
                                >
                                    <FileDown className="w-4 h-4" />
                                    Export
                                </Button>
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="flex items-center gap-2 px-3 py-2"
                                    onClick={handleDownloadPDF}
                                >
                                    <Download className="w-4 h-4" />
                                    PDF
                                </Button>
                            </div>
                        </div>

                        {/* Hidden file input for JSON import */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            style={{ display: 'none' }}
                        />

                        <div className="flex-1 overflow-hidden bg-surface-secondary">
                            <ResumePreview />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ResumeMaker() {
    return (
        <ResumeProvider>
            <ResumeContent />
        </ResumeProvider>
    );
}
