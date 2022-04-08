import { Injectable } from '@nestjs/common'
import { UpdatePersonDto } from '../person/dto/update-person.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
    constructor(private prismaService: PrismaService) {}

    async updateUserProfile(id: string, data: UpdatePersonDto) {
        return await this.prismaService.person.update({where: {id}, data})
    }
}
