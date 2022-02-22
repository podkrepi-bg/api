import { PartialType } from '@nestjs/swagger';
import { CreateVaultDto } from './create-vault.dto';

export class UpdateVaultDto extends PartialType(CreateVaultDto) {}
