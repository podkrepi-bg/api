import { PartialType } from '@nestjs/swagger';
import { CreateInfoRequestDto } from './create-info-request.dto';

export class UpdateInfoRequestDto extends PartialType(CreateInfoRequestDto) {}
