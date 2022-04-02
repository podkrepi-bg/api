import { PartialType } from '@nestjs/swagger'
import { CreateBenefactorDto } from './create-benefactor.dto'

export class UpdateBenefactorDto extends PartialType(CreateBenefactorDto) {}
