import { PartialType } from '@nestjs/swagger'
import { CreateBootcampSimeonDto } from './create-bootcamp-simeon.dto'

export class UpdateBootcampSimeonDto extends PartialType(CreateBootcampSimeonDto) {}
