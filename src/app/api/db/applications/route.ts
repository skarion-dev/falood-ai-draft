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
    const pool = new Pool({
        connectionString,
        max: 1,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
    });
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
    } finally {
        await prisma.$disconnect();
    }
}

export async function GET(request: Request) {
    const prisma = getPrismaClient();
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            // Fetch single application by ID
            const application = await prisma.savedApplication.findUnique({
                where: { id },
            });

            if (!application) {
                return NextResponse.json(
                    { success: false, error: 'Application not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, data: application });
        }

        // Fetch all applications
        const applications = await prisma.savedApplication.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: applications });
    } catch (error: any) {
        console.error('Error fetching applications:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch applications' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(request: Request) {
    const prisma = getPrismaClient();
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Missing application ID' },
                { status: 400 }
            );
        }

        await prisma.savedApplication.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting application:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete application' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
