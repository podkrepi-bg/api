import { PartialType } from '@nestjs/swagger'
import { CreateIrregularityFileDto } from './create-irregularity-file.dto'

export class UpdateIrregularityFileDto extends PartialType(CreateIrregularityFileDto) {}
