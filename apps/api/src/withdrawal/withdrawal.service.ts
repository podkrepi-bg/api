import { Injectable } from '@nestjs/common';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';

@Injectable()
export class WithdrawalService {
  create(createWithdrawalDto: CreateWithdrawalDto) {
    return 'This action adds a new withdrawal';
  }

  findAll() {
    return `This action returns all withdrawal`;
  }

  findOne(id: number) {
    return `This action returns a #${id} withdrawal`;
  }

  update(id: number, updateWithdrawalDto: UpdateWithdrawalDto) {
    return `This action updates a #${id} withdrawal`;
  }

  remove(id: number) {
    return `This action removes a #${id} withdrawal`;
  }
}
