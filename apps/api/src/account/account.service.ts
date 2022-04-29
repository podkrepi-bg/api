import { Injectable } from '@nestjs/common'
import { Person } from '@prisma/client';
import { UpdatePersonDto } from '../person/dto/update-person.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
    constructor(private prismaService: PrismaService) {}

    async updateUserProfile(keycloakId: string, data: UpdatePersonDto): Promise<Person> {
        return await this.prismaService.person.update({ where: { keycloakId }, data })
    }
}
