import {PrismaClient} from '@prisma/client';
import log from "../utils/log.ts";

export const prisma = new PrismaClient();

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    log.success('Connected to the database successfully.');
  } catch (error) {
    log.error('Failed to connect to the database:', error);
  }
};
