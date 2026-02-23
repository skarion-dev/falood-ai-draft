"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ArrowLeft, Briefcase, FileText, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface SavedApplication {
    id: string;
    createdAt: string;
    updatedAt: string;
    jobDescription: string | null;
    companyName: string | null;
    skills: string[];
    resumeData: any;
    chatHistory: any;
}

export default function DashboardPage() {
    const [applications, setApplications] = useState<SavedApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this saved application?')) {
            return;
        }

        try {
            const res = await fetch(`/api/db/applications/${id}`, {
                method: 'DELETE'
            });
            const json = await res.json();

            if (json.success) {
                setApplications(prev => prev.filter(app => app.id !== id));
                toast({
                    title: "Application Deleted",
                    description: "Your saved resume has been removed.",
                });
            } else {
                throw new Error(json.error || 'Failed to delete');
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Could not delete application.",
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await fetch('/api/db/applications');
                const json = await res.json();
                if (json.success) {
                    setApplications(json.data);
                }
            } catch (error) {
                console.error("Failed to fetch applications", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApps();
    }, []);

    // Aggregate skills
    const skillCounts: Record<string, number> = {};
    applications.forEach(app => {
        app.skills?.forEach(s => {
            const normalized = s.toLowerCase().trim();
            if (normalized) {
                skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
            }
        });
    });

    const sortedSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1]);

    return (
        <div className="min-h-screen bg-surface p-6">
            <div className="container mx-auto max-w-6xl space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Applications Dashboard</h1>
                        <p className="text-muted-foreground">Manage your saved resumes and track required skills.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Skills Summary Card */}
                    <Card className="col-span-full xl:col-span-1 shadow-sm">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary" />
                                Aggregated Job Skills
                            </CardTitle>
                            <CardDescription>Most requested skills from your saved job descriptions</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {applications.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No applications saved yet.</p>
                            ) : sortedSkills.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No skills extracted from your job descriptions.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {sortedSkills.map(([skill, count]) => (
                                        <Badge key={skill} variant="secondary" className="px-3 py-1 text-sm bg-primary/10 hover:bg-primary/20 text-primary border-primary/20">
                                            {skill} {count > 1 ? `(${count})` : ''}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card className="col-span-full xl:col-span-1 shadow-sm">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                Application Stats
                            </CardTitle>
                            <CardDescription>Overview of your saved progress</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 flex flex-col justify-center gap-4">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-surface-secondary rounded-xl p-4 border border-border">
                                    <div className="text-3xl font-bold text-foreground">{applications.length}</div>
                                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">Saved Resumes</div>
                                </div>
                                <div className="bg-surface-secondary rounded-xl p-4 border border-border">
                                    <div className="text-3xl font-bold text-foreground">{sortedSkills.length}</div>
                                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">Unique Skills Tracked</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 text-foreground/80 flex items-center gap-2">
                        <Download className="w-5 h-5" /> Saved Applications
                    </h2>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                            <h3 className="text-lg font-medium">No saved applications found</h3>
                            <p className="text-muted-foreground mt-2">Go back to the editor, add a job description, and click "Save to Dashboard".</p>
                            <Button className="mt-6" asChild>
                                <Link href="/">Back to Editor</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {applications.map((app) => {
                                const roleTitle = app.resumeData?.personalInfo?.jobTitle || "Untitled Resume";
                                const companyName = app.companyName || "Unknown target company";

                                return (
                                    <Link key={app.id} href={`/?id=${app.id}`} className="block group">
                                        <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
                                            <CardHeader className="p-4 pb-2 bg-gradient-to-b from-muted/50 to-transparent">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant="outline" className="text-[10px] bg-background">
                                                        {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                                                    </Badge>
                                                    <div className="flex items-center gap-2">
                                                        {app.skills?.length > 0 && (
                                                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                {app.skills.length} skills
                                                            </span>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                                            onClick={(e) => handleDelete(e, app.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                                                    {roleTitle}
                                                </CardTitle>
                                                <CardDescription className="truncate text-xs">
                                                    Company: {companyName}
                                                </CardDescription>
                                            </CardHeader>
                                            <div className="px-4 pb-4">
                                                <div className="h-20 text-xs text-muted-foreground bg-muted/20 rounded p-2 overflow-hidden text-ellipsis line-clamp-4 relative">
                                                    {app.jobDescription || "No job description provided."}
                                                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent" />
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
