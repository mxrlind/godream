import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SocialModule } from './modules/social/social.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { StorageModule } from './modules/storage/storage.module';
import { AdminModule } from './modules/admin/admin.module';
import { SearchModule } from './modules/search/search.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CommunityModule } from './modules/community/community.module';

@Module({
  imports: [
    // ─── Config ──────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),

    // ─── Rate Limiting ────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'short',
          ttl: 1000,
          limit: 10,
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: 50,
        },
        {
          name: 'long',
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // ─── Scheduled tasks ─────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Event emitter ────────────────────────────────────────
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // ─── Queue (Bull) ─────────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      }),
    }),

    // ─── Core ─────────────────────────────────────────────────
    DatabaseModule,
    StorageModule,

    // ─── Feature Modules ──────────────────────────────────────
    AuthModule,
    UsersModule,
    CoursesModule,
    LessonsModule,
    GamificationModule,
    PaymentsModule,
    SocialModule,
    NotificationsModule,
    QuizzesModule,
    CertificatesModule,
    AdminModule,
    SearchModule,
    AnalyticsModule,
    CommunityModule,
  ],
})
export class AppModule {}
