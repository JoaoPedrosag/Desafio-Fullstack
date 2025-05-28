import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ValidationService } from './services/validation.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [ValidationService],
  exports: [PrismaModule, ValidationService],
})
export class CoreModule {}
