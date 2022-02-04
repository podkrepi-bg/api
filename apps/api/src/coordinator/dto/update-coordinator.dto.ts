import { PartialType } from '@nestjs/swagger'
import { CreateCoordinatorDto } from './create-coordinator.dto'

export class UpdateCoordinatorDto extends PartialType(CreateCoordinatorDto) {}
