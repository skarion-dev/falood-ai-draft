"use client";

import React, { useState, useRef } from 'react';
import { ResumeProvider } from '@/contexts/ResumeContext';
import { ResumeForm } from '@/components/form/ResumeForm';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Eye, EyeOff, Palette, Settings, AlertTriangle, Upload, FileDown, Sparkles, Save } from 'lucide-react';
import { AiSuggestions } from '@/components/preview/AiSuggestions';
import { cn } from '@/lib/utils';
import { useResume } from '@/contexts/ResumeContext';
import { exportResumeAsJSON, importResumeFromJSON } from '@/utils/resumeImportExport';
import { useToast } from '@/components/ui/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

const ResumeContent: React.FC = () => {
    const [showPreview, setShowPreview] = useState(true);
    const [showAiPanel, setShowAiPanel] = useState(true);
    const [activePanel, setActivePanel] = useState<'form' | 'customize' | 'settings'>('form');
    const [pageOverflow, setPageOverflow] = useState(false);
    const { state, exportResumeData, importResumeData, setChatHistory, setJobDescription } = useResume();
    const resumeRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            const fetchApplication = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`/api/db/applications/${id}`);
                    const json = await response.json();
                    if (json.success && json.data) {
                        importResumeData(json.data.resumeData);
                        setChatHistory(json.data.chatHistory);
                        setJobDescription(json.data.jobDescription || '');
                        toast({
                            title: "Application Loaded",
                            description: "Content restored from dashboard.",
                        });
                    }
                } catch (error) {
                    console.error("Error fetching application", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchApplication();
        }
    }, [searchParams]);

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

    const handleSaveToDashboard = async () => {
        setIsSaving(true);
        try {
            let extractedSkills: string[] = [];
            let extractedCompany: string | null = null;
            if (state.jobDescription) {
                try {
                    const skillsResponse = await fetch('/api/extract-skills', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ jobDescription: state.jobDescription }),
                    });
                    if (skillsResponse.ok) {
                        const skillsData = await skillsResponse.json();
                        extractedSkills = skillsData.skills || [];
                        extractedCompany = skillsData.companyName || null;
                    }
                } catch (err) {
                    console.error("Failed to extract skills", err);
                }
            }

            const saveResponse = await fetch('/api/db/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobDescription: state.jobDescription,
                    companyName: extractedCompany,
                    skills: extractedSkills,
                    resumeData: state.resumeData,
                    chatHistory: state.chatHistory,
                }),
            });

            if (saveResponse.ok) {
                toast({
                    title: "Application Saved",
                    description: "Successfully saved to your dashboard.",
                });
                router.push('/dashboard');
            } else {
                throw new Error("Failed to save applications");
            }
        } catch (error) {
            console.error('Error saving:', error);
            toast({
                title: "Save Failed",
                description: "There was an error saving your application.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
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

                {/* Desktop toggle buttons */}
                <div className="hidden xl:flex justify-end mb-4 gap-2 print:hidden">
                    <Button
                        variant={showAiPanel ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        className="flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        {showAiPanel ? 'Hide AI Assistant' : 'Show AI Assistant'}
                    </Button>
                </div>

                <div className="flex flex-col xl:flex-row gap-6 max-w-[1800px] mx-auto">
                    {/* Form Panel */}
                    <div className={cn(
                        "w-full lg:w-[600px] xl:w-[500px] h-[750px] bg-card rounded-xl shadow-lg overflow-hidden flex flex-col print:hidden",
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
                        "w-full lg:w-auto xl:flex-1 h-[750px] bg-card rounded-xl shadow-lg overflow-hidden flex flex-col print:w-full print:h-auto print:shadow-none print:rounded-none print:block print:overflow-visible",
                        "lg:flex",
                        showPreview ? "flex" : "hidden lg:flex"
                    )}>
                        <div className="border-b border-border p-4 flex items-center justify-between flex-shrink-0 print:hidden">
                            <div></div>
                            <div className="flex items-center gap-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center gap-2 px-3 py-2"
                                    onClick={handleSaveToDashboard}
                                    disabled={isSaving}
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Saving...' : 'Save to Dashboard'}
                                </Button>
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

                    {/* AI Suggestions Panel */}
                    {showAiPanel && (
                        <div className={cn(
                            "w-full xl:w-[400px] h-[750px] bg-card rounded-xl shadow-lg overflow-hidden flex flex-col print:hidden",
                            "hidden xl:flex"
                        )}>
                            <div className="flex-1 overflow-hidden p-2">
                                <AiSuggestions />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function ResumeMaker() {
    return (
        <ResumeProvider>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
                <ResumeContent />
            </Suspense>
        </ResumeProvider>
    );
}
