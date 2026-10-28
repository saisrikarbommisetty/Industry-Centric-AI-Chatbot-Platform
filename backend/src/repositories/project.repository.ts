import { prisma, isDatabaseConnected } from '../config/database';
import { ProjectDTO } from '../types';
import { logger } from '../utils/logger';

// In-memory cache & fallback store for projects
const memoryProjects: Map<string, any> = new Map();

// Initialize default Prycoons and other bots in memory store
function initializeDefaults() {
  if (memoryProjects.size === 0) {
    const defaultPrycoons = {
      id: 'prycoons-ai',
      name: 'Prycoons Real Estate Assistant',
      slug: 'prycoons-ai',
      industry: 'real-estate',
      industryName: 'Real Estate & Property',
      websiteUrl: 'https://prycoons.com/',
      description: 'Conversational assistant for Prycoons Real Estate. Naturally guides visitors through luxury apartments, BHK configurations, project pricing, brochures, and visit bookings.',
      systemInstructions: 'Represent Prycoons Real Estate with human warmth and consultative expertise. Ask one natural question at a time. Mix personal lifestyle questions with property criteria, summarize matches, offer WhatsApp shortlist delivery, and connect to advisors.',
      avatar: '🏢',
      primaryColor: '#C85C4A',
      tone: 'Warm, Consultative & Friendly',
      welcomeMessage: "Welcome to Prycoons! How can we help with your property search?",
      suggestedQuestions: ['Looking to Buy 🏡', 'Thinking of Renting 🔑', 'Just Browsing ✨', 'Explore properties'],
      leadCaptureEnabled: true,
      leadCaptureFields: ['name', 'phone', 'email'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryProjects.set(defaultPrycoons.id, defaultPrycoons);
    memoryProjects.set(defaultPrycoons.slug, defaultPrycoons);

    const defaultMarketing = {
      id: 'apex-brand-ai',
      name: 'Apex Creative & Branding Assistant',
      slug: 'apex-brand-ai',
      industry: 'marketing',
      industryName: 'Marketing & Creative Agency',
      websiteUrl: 'https://apexbrand.studio/',
      description: 'Brand identity, UI/UX design, performance social marketing, and client intake assistant with location-aware trend conversations.',
      systemInstructions: 'Understand client brand stories, discover their creative & marketing requirements, mix light aesthetic questions with strategic goals, share portfolio one-liners, and capture leads.',
      avatar: '⚡',
      primaryColor: '#2A7E8C',
      tone: 'Creative, Friendly & Consultative',
      welcomeMessage: 'Hi there 👋 Good day! Welcome to Apex Brand Studio. I’m Maya. May I know your name?',
      suggestedQuestions: ['Eco-friendly startup 🌱', 'Brand identity & logo 🎨', 'Website & UX design 💻', 'Social media growth 📈'],
      leadCaptureEnabled: true,
      leadCaptureFields: ['name', 'phone', 'email'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryProjects.set(defaultMarketing.id, defaultMarketing);
    memoryProjects.set(defaultMarketing.slug, defaultMarketing);
  }
}

initializeDefaults();

export class ProjectRepository {
  async findById(id: string): Promise<any | null> {
    const cached = memoryProjects.get(id);
    if (cached) return cached;

    if (isDatabaseConnected) {
      try {
        const proj = await prisma.project.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                knowledgeSources: true,
                chatSessions: true,
                leads: true,
              },
            },
          },
        });
        if (proj) {
          memoryProjects.set(id, proj);
          if (proj.slug) memoryProjects.set(proj.slug, proj);
          return proj;
        }
      } catch (err: any) {
        logger.warn(`Database project lookup failed: ${err.message}. Falling back to memory.`);
      }
    }
    return memoryProjects.get(id) || null;
  }

  async findBySlug(slug: string): Promise<any | null> {
    const cached = memoryProjects.get(slug);
    if (cached) return cached;

    if (isDatabaseConnected) {
      try {
        const proj = await prisma.project.findUnique({
          where: { slug },
          include: {
            _count: {
              select: {
                knowledgeSources: true,
                chatSessions: true,
                leads: true,
              },
            },
          },
        });
        if (proj) {
          memoryProjects.set(slug, proj);
          if (proj.id) memoryProjects.set(proj.id, proj);
          return proj;
        }
      } catch (err: any) {
        logger.warn(`Database slug lookup failed: ${err.message}. Falling back to memory.`);
      }
    }
    return memoryProjects.get(slug) || null;
  }

  async findAll(): Promise<any[]> {
    if (isDatabaseConnected) {
      try {
        return await prisma.project.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                knowledgeSources: true,
                chatSessions: true,
                leads: true,
              },
            },
          },
        });
      } catch (err: any) {
        logger.warn(`Database projects list failed: ${err.message}. Falling back to memory.`);
      }
    }
    const unique = Array.from(new Set(Array.from(memoryProjects.values())));
    return unique;
  }

  async create(data: any): Promise<any> {
    const id = data.id || `proj-${Date.now()}`;
    const slug = data.slug || id;
    const projectRecord = { ...data, id, slug, createdAt: new Date(), updatedAt: new Date() };

    if (isDatabaseConnected) {
      try {
        return await prisma.project.upsert({
          where: { id },
          update: projectRecord,
          create: projectRecord,
        });
      } catch (err: any) {
        logger.warn(`Database project create failed: ${err.message}. Saving to memory.`);
      }
    }
    memoryProjects.set(id, projectRecord);
    memoryProjects.set(slug, projectRecord);
    return projectRecord;
  }

  async update(id: string, updates: any): Promise<any> {
    if (isDatabaseConnected) {
      try {
        return await prisma.project.update({ where: { id }, data: updates });
      } catch (err: any) {
        logger.warn(`Database project update failed: ${err.message}. Updating in memory.`);
      }
    }
    const existing = memoryProjects.get(id) || {};
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    memoryProjects.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    if (isDatabaseConnected) {
      try {
        await prisma.project.delete({ where: { id } });
        memoryProjects.delete(id);
        return true;
      } catch (err: any) {
        logger.warn(`Database project delete failed: ${err.message}.`);
      }
    }
    memoryProjects.delete(id);
    return true;
  }
}

export const projectRepository = new ProjectRepository();
