import { PartialType } from '@nestjs/swagger'
import { CreateCityDto } from './create-city.dto'

export class UpdateCityDto extends PartialType(CreateCityDto) {}
