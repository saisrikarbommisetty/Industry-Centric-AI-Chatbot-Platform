import { prisma } from '../src/config/database';

async function check() {
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { projectId: 'prycoons-ai' },
    select: { id: true, content: true, metadata: true }
  });
  console.log('Total chunks in DB for prycoons-ai:', chunks.length);
  const localities: Record<string, number> = {};
  for (const c of chunks) {
    const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : (c.metadata || {});
    const loc = meta.location || 'Unknown';
    localities[loc] = (localities[loc] || 0) + 1;
  }
  console.log('Chunks by locality in DB:', localities);
  process.exit(0);
}

check();
