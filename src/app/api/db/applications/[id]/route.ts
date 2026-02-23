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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const application = await withPrisma(prisma =>
            prisma.savedApplication.findUnique({ where: { id } })
        );

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
    try {
        const { id } = await params;

        await withPrisma(prisma =>
            prisma.savedApplication.delete({ where: { id } })
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting application:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete application' },
            { status: 500 }
        );
    }
}
