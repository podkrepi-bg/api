import { PartialType } from '@nestjs/swagger'
import { CreateCatDto } from './create-cat.dto'

export class UpdateCatDto extends PartialType(CreateCatDto) {}
