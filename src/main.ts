import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

const getCorsOrigin = (): boolean | string[] => {
  const corsOrigin = process.env.CORS_ORIGIN;

  if (!corsOrigin) {
    return true;
  }

  return corsOrigin.split(',').map((origin) => origin.trim());
};

const formatValidationErrors = (errors: ValidationError[]): string[] =>
  errors.flatMap((error) => {
    const messages = Object.values(error.constraints ?? {});
    const childMessages = formatValidationErrors(error.children ?? []);

    return [...messages, ...childMessages];
  });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: getCorsOrigin(),
    credentials: true,
  });
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Weblog API')
    .setDescription('NestJS weblog API using TypeORM and PostgreSQL.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Health')
    .addTag('Auth')
    .addTag('Users')
    .addTag('Categories')
    .addTag('Tags')
    .addTag('Posts')
    .addTag('Comments')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api-docs', app, swaggerDocument);

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException(formatValidationErrors(errors)),
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
