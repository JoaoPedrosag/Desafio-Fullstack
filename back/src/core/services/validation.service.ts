import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ValidationService {
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateUUID(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  validatePagination(
    page?: number,
    limit?: number,
  ): { page: number; limit: number } {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(100, Math.max(1, limit || 10));

    return { page: validatedPage, limit: validatedLimit };
  }

  validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  validateFileSize(size: number, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return size <= maxSizeInBytes;
  }

  sanitizeString(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

  validateRequired(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${fieldName} is required`);
    }
  }

  validateStringLength(
    value: string,
    fieldName: string,
    min: number,
    max: number,
  ): void {
    if (value.length < min || value.length > max) {
      throw new BadRequestException(
        `${fieldName} must be between ${min} and ${max} characters`,
      );
    }
  }

  validateArrayLength(
    array: any[],
    fieldName: string,
    min: number,
    max: number,
  ): void {
    if (array.length < min || array.length > max) {
      throw new BadRequestException(
        `${fieldName} must contain between ${min} and ${max} items`,
      );
    }
  }
}
