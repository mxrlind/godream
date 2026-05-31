import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@godream/database';

export const DATABASE_SERVICE = 'DATABASE_SERVICE';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_SERVICE,
      useFactory: () => {
        const prisma = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
        });
        prisma.$connect();
        return prisma;
      },
    },
  ],
  exports: [DATABASE_SERVICE],
})
export class DatabaseModule {}
