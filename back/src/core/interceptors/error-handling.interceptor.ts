import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Prisma } from '@prisma/client';

@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorHandlingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        this.logger.error('Error caught by interceptor:', error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          return throwError(() => this.handlePrismaError(error));
        }

        if (error instanceof Prisma.PrismaClientValidationError) {
          return throwError(
            () =>
              new HttpException(
                'Invalid data provided',
                HttpStatus.BAD_REQUEST,
              ),
          );
        }

        if (error instanceof HttpException) {
          return throwError(() => error);
        }

        return throwError(
          () =>
            new HttpException(
              'Internal server error',
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): HttpException {
    switch (error.code) {
      case 'P2002':
        return new HttpException(
          'A record with this data already exists',
          HttpStatus.CONFLICT,
        );
      case 'P2025':
        return new HttpException('Record not found', HttpStatus.NOT_FOUND);
      case 'P2003':
        return new HttpException(
          'Foreign key constraint failed',
          HttpStatus.BAD_REQUEST,
        );
      case 'P2014':
        return new HttpException('Invalid ID provided', HttpStatus.BAD_REQUEST);
      default:
        this.logger.error(`Unhandled Prisma error: ${error.code}`, error);
        return new HttpException(
          'Database error occurred',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }
}
