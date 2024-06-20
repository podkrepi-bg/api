import { Module } from '@nestjs/common'
import { CompanyService } from './company.service'
import { CompanyController } from './company.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
