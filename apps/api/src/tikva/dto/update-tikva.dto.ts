import { PartialType } from '@nestjs/swagger'
import { CreateTikvaDto } from './create-tikva.dto'

export class UpdateTikvaDto extends PartialType(CreateTikvaDto) {}
