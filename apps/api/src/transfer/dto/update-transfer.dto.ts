import { PartialType } from '@nestjs/swagger'
import { CreateTransferDto } from './create-transfer.dto'

export class UpdateTransferDto extends PartialType(CreateTransferDto) {}
