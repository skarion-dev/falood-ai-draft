import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export const dynamic = 'force-dynamic';

function getPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL must be set in your .env file.");
    }
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export async function POST(request: Request) {
    const prisma = getPrismaClient();
    try {
        const body = await request.json();
        const { jobDescription, companyName, skills, resumeData, chatHistory } = body;

        const application = await prisma.savedApplication.create({
            data: {
                jobDescription,
                companyName,
                skills: skills || [],
                resumeData: resumeData || {},
                chatHistory: chatHistory || [],
            },
        });

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
    const prisma = getPrismaClient();
    try {
        const applications = await prisma.savedApplication.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ success: true, data: applications });
    } catch (error: any) {
        console.error('Error fetching applications:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch applications' },
            { status: 500 }
        );
    }
}
