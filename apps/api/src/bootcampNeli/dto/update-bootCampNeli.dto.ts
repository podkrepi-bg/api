import { PartialType } from '@nestjs/swagger'

import { CreateBootcampNeliDto } from './create-bootcampNeli.dto'

export class UpdateBootcampNeliDto extends PartialType(CreateBootcampNeliDto) {}
