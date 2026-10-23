import bcrypt from 'bcryptjs';
import { prisma, isDatabaseConnected } from '../config/database';
import { logger } from '../utils/logger';

const DEMO_USER = {
  id: 'user-sai',
  name: 'Sai Srikar',
  email: 'saisrikar@example.com',
  passwordHash: bcrypt.hashSync('saisrikarbrim@123', 10),
  role: 'CLIENT_DIRECTOR',
  organization: 'BRIM Workspace',
  avatar: 'SS',
  plan: 'Growth Pro',
  createdAt: new Date('2026-08-01'),
  updatedAt: new Date('2026-08-01'),
};

const memoryUsers: Map<string, any> = new Map([
  [DEMO_USER.id, DEMO_USER],
  [DEMO_USER.email, DEMO_USER],
]);

export class UserRepository {
  async findByEmail(email: string): Promise<any | null> {
    const clean = (email || '').trim().toLowerCase();
    if (isDatabaseConnected) {
      try {
        const user = await prisma.user.findUnique({ where: { email: clean } });
        if (user) return user;
      } catch (err: any) {
        logger.warn(`User findByEmail DB error: ${err.message}`);
      }
    }
    return memoryUsers.get(clean) || null;
  }

  async findById(id: string): Promise<any | null> {
    if (isDatabaseConnected) {
      try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (user) return user;
      } catch (err: any) {
        logger.warn(`User findById DB error: ${err.message}`);
      }
    }
    return memoryUsers.get(id) || null;
  }

  async create(data: { name: string; email: string; password: string; organization?: string; role?: string }): Promise<any> {
    const cleanEmail = data.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const id = `usr-${Date.now()}`;
    const userRecord = {
      id,
      name: data.name,
      email: cleanEmail,
      passwordHash,
      role: (data.role as any) || 'CLIENT_DIRECTOR',
      organization: data.organization || `${data.name}'s Workspace`,
      avatar: data.name.slice(0, 2).toUpperCase(),
      plan: 'Growth Pro',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isDatabaseConnected) {
      try {
        return await prisma.user.upsert({
          where: { email: cleanEmail },
          update: userRecord as any,
          create: userRecord as any,
        });
      } catch (err: any) {
        logger.warn(`User create DB error: ${err.message}. Storing in memory.`);
      }
    }

    memoryUsers.set(id, userRecord);
    memoryUsers.set(cleanEmail, userRecord);
    return userRecord;
  }
}

export const userRepository = new UserRepository();
