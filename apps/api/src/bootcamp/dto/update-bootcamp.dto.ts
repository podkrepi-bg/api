import { PartialType } from '@nestjs/swagger';
import { CreateBootcampDto } from './create-bootcamp.dto';

export class UpdateBootcampDto extends PartialType(CreateBootcampDto) {}
