import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export const dynamic = 'force-dynamic';

async function withPrisma<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL must be set in your .env file.");
    }
    const client = new Client({ connectionString });
    await client.connect();
    const adapter = new PrismaPg(client as any);
    const prisma = new PrismaClient({ adapter });
    try {
        return await fn(prisma);
    } finally {
        await client.end();
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { jobDescription, companyName, skills, resumeData, chatHistory } = body;

        const application = await withPrisma(prisma =>
            prisma.savedApplication.create({
                data: {
                    jobDescription,
                    companyName,
                    skills: skills || [],
                    resumeData: resumeData || {},
                    chatHistory: chatHistory || [],
                },
            })
        );

        return NextResponse.json({ success: true, data: application });
    } catch (error: any) {
        console.error('Error saving application:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to save application' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const applications = await withPrisma(prisma =>
            prisma.savedApplication.findMany({
                orderBy: { createdAt: 'desc' },
            })
        );

        return NextResponse.json({ success: true, data: applications });
    } catch (error: any) {
        console.error('Error fetching applications:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch applications' },
            { status: 500 }
        );
    }
}
