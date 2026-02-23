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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = getPrismaClient();
    try {
        const { id } = await params;

        const application = await prisma.savedApplication.findUnique({
            where: {
                id,
            },
        });

        if (!application) {
            return NextResponse.json(
                { success: false, error: 'Application not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: application });
    } catch (error: any) {
        console.error('Error fetching application:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch application' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = getPrismaClient();
    try {
        const { id } = await params;

        await prisma.savedApplication.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting application:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete application' },
            { status: 500 }
        );
    }
}
