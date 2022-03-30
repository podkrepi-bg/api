import { Injectable } from '@nestjs/common'
import { CreateBootcampDto } from './dto/create-bootcamp.dto'
import { UpdateBootcampDto } from './dto/update-bootcamp.dto'

@Injectable()
export class BootcampService {
  create(createBootcampDto: CreateBootcampDto) {
    return 'This action adds a new bootcamp'
  }

  findAll() {
    return `This action returns all bootcamp`
  }

  findOne(id: string) {
    return `This action returns a #${id} bootcamp`
  }

  update(id: string, updateBootcampDto: UpdateBootcampDto) {
    return `This action updates a #${id} bootcamp`
  }

  remove(id: string) {
    return `This action removes a #${id} bootcamp`
  }
}
