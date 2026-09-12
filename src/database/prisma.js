import { PrismaClient } from '@prisma/client';

// Instância única partilhada do PrismaClient para todo o bot
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

export default prisma;
