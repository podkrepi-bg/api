import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { CreateBenefactorDto } from './create-benefactor.dto'
import { Person } from '@prisma/client'

export class UpdateBenefactorDto extends PartialType(CreateBenefactorDto) {}
