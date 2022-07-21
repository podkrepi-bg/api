import { PartialType } from '@nestjs/swagger'
import { CreateOrganizerDto } from './create-organizer.dto'

export class UpdateOrganizerDto extends PartialType(CreateOrganizerDto) {}
