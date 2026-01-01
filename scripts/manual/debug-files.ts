
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const projectId = '427d9924-f529-4190-b16e-3ccac4a3bac9';

    console.log('--- Fetching all files for project ---');
    const files = await prisma.file.findMany({
        where: { projectId },
        select: {
            id: true,
            filename: true,
            originalName: true,
            storagePath: true,
            mimeType: true,
            comment: true,
        }
    });

    console.table(files);

    console.log('\n--- Testing "Comments Only" Filter ---');
    // Logic used in backend: storagePath = null
    const commentsOnly = await prisma.file.findMany({
        where: {
            projectId,
            storagePath: null
        }
    });
    console.log(`Matches found with storagePath: null => ${commentsOnly.length}`);

    console.log('\n--- Testing "Comments Only" Filter (filename based) ---');
    // Logic used previously: filename = null
    const commentsFilename = await prisma.file.findMany({
        where: {
            projectId,
            filename: null
        }
    });
    console.log(`Matches found with filename: null => ${commentsFilename.length}`);

    console.log('\n--- Testing Search (e.g. "jkl") ---');
    const searchTerm = 'jkl'; // Based on screenshot content "jkljlk..."
    const searchResults = await prisma.file.findMany({
        where: {
            projectId,
            OR: [
                { filename: { contains: searchTerm, mode: 'insensitive' } },
                { originalName: { contains: searchTerm, mode: 'insensitive' } },
                { comment: { contains: searchTerm, mode: 'insensitive' } },
            ]
        }
    });
    console.log(`Matches found for "${searchTerm}" => ${searchResults.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
