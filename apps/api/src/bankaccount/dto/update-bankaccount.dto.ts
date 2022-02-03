import { PartialType } from '@nestjs/swagger';
import { CreateBankaccountDto } from './create-bankaccount.dto';

export class UpdateBankaccountDto extends PartialType(CreateBankaccountDto) {}
