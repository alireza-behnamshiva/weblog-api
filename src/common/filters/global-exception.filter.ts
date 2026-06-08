import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ApiErrorResponse } from '../errors/api-error-response';

type HttpExceptionBody = {
  statusCode?: number;
  error?: string;
  message?: string | string[];
};

type PostgresError = {
  code?: string;
  constraint?: string;
  detail?: string;
};

const UNIQUE_CONSTRAINT_MESSAGES: Record<string, string> = {
  UQ_97672ac88f789774dd47f7c8be3: 'Email is already registered',
  UQ_54ddf9075260407dcfdd7248577: 'Post slug already exists',
  UQ_8b0be371d28245da6e4f4b61878: 'Category name already exists',
  UQ_420d9f679d41281f282f5bc7d09: 'Category slug already exists',
  UQ_d90243459a697eadb8ad56e9092: 'Tag name already exists',
  UQ_b3aa10c29ea4e61a830362bd25a: 'Tag slug already exists',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const normalizedException = this.normalizeException(exception);
    const statusCode = normalizedException.getStatus();
    const exceptionResponse = normalizedException.getResponse();
    const body = this.getBody(exceptionResponse, statusCode);

    response.status(statusCode).json({
      ...body,
      path: request.url,
      timestamp: new Date().toISOString(),
    } satisfies ApiErrorResponse);
  }

  private normalizeException(exception: unknown): HttpException {
    if (exception instanceof HttpException) {
      return exception;
    }

    if (exception instanceof QueryFailedError) {
      return this.normalizeQueryFailedError(
        exception as QueryFailedError<Error>,
      );
    }

    return new InternalServerErrorException('Internal server error');
  }

  private normalizeQueryFailedError(
    exception: QueryFailedError<Error>,
  ): HttpException {
    const driverError = exception.driverError as PostgresError | undefined;

    if (driverError?.code === '23505') {
      return new ConflictException(
        this.getUniqueConstraintMessage(driverError.constraint),
      );
    }

    return new InternalServerErrorException('Database operation failed');
  }

  private getUniqueConstraintMessage(constraint?: string): string {
    if (!constraint) {
      return 'Resource already exists';
    }

    return UNIQUE_CONSTRAINT_MESSAGES[constraint] ?? 'Resource already exists';
  }

  private getBody(
    exceptionResponse: string | object,
    statusCode: number,
  ): Omit<ApiErrorResponse, 'path' | 'timestamp'> {
    if (typeof exceptionResponse === 'string') {
      return {
        statusCode,
        error: this.getErrorName(statusCode),
        message: exceptionResponse,
      };
    }

    const body = exceptionResponse as HttpExceptionBody;

    return {
      statusCode,
      error: body.error ?? this.getErrorName(statusCode),
      message: body.message ?? this.getErrorName(statusCode),
    };
  }

  private getErrorName(statusCode: number): string {
    return HttpStatus[statusCode] ?? 'Error';
  }
}
