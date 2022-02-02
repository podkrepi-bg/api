import { PartialType } from '@nestjs/swagger'
import { CreateBootcampInternDto } from './create-bootcamp-intern.dto'

export class UpdateBootcampInternDto extends PartialType(CreateBootcampInternDto) {}
