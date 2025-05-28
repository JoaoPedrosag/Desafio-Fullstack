import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface RequestWithMethodAndUrl {
  method: string;
  url: string;
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithMethodAndUrl>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (duration > 1000) {
          this.logger.warn(`Slow request: ${method} ${url} took ${duration}ms`);
        } else if (duration > 500) {
          this.logger.log(`Request: ${method} ${url} took ${duration}ms`);
        }
      }),
    );
  }
}
