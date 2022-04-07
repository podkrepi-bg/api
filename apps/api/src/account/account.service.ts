import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
    constructor(private prismaService: PrismaService) {}

    async updateUserProfile(id: string, data: any) {
        if (data.birthday) {
            data.birthday = new Date(data.birthday);
        }

        return await this.prismaService.person.update({where: {id}, data})
    }
}
