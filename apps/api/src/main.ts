import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
    rawBody: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);
  const env = config.get<string>('NODE_ENV', 'development');

  // ─── Security ────────────────────────────────────────────────
  app.use(helmet({ crossOriginEmbedderPolicy: false }));
  app.use(compression());

  // ─── CORS ────────────────────────────────────────────────────
  const corsOrigins = config.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(',');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ─── Global prefix ───────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Validation ──────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  // ─── Filters & Interceptors ──────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ─── Swagger (dev only) ───────────────────────────────────────
  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('GoDream API')
      .setDescription('GoDream Platform REST API — Educação Gamificada')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addTag('auth', 'Autenticação e autorização')
      .addTag('users', 'Gestão de usuários')
      .addTag('courses', 'Cursos e conteúdo')
      .addTag('lessons', 'Aulas e progresso')
      .addTag('gamification', 'XP, níveis, badges, moedas')
      .addTag('payments', 'Pagamentos e assinaturas')
      .addTag('social', 'Comunidade e feed')
      .addTag('admin', 'Painel administrativo')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    Logger.log(`📚 Swagger: http://localhost:${port}/docs`);
  }

  await app.listen(port);
  Logger.log(`🚀 GoDream API running on port ${port} [${env}]`);
}

bootstrap();
