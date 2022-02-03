import { PartialType } from '@nestjs/swagger'
import { CreateCountryDto } from './create-country.dto'

export class UpdateCountryDto extends PartialType(CreateCountryDto) {}
