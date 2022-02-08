import { Injectable } from '@nestjs/common';
import { CreateInfoRequestDto } from './dto/create-info-request.dto';
import { UpdateInfoRequestDto } from './dto/update-info-request.dto';

@Injectable()
export class InfoRequestService {
  create(createInfoRequestDto: CreateInfoRequestDto) {
    return 'This action adds a new infoRequest';
  }

  findAll() {
    return `This action returns all infoRequest`;
  }

  findOne(id: number) {
    return `This action returns a #${id} infoRequest`;
  }

  update(id: number, updateInfoRequestDto: UpdateInfoRequestDto) {
    return `This action updates a #${id} infoRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} infoRequest`;
  }
}
