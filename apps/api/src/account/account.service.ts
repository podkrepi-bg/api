import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
    constructor(private prismaService: PrismaService) {}

    async updateUserProfile(id: string, data: any) {
        return await this.prismaService.person.update({where: {id}, data})
    }
}
