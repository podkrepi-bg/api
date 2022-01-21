import { Injectable, Logger } from '@nestjs/common'
import { CreateHedgehogDto } from './dto/create-hedgehog.dto'
import { UpdateHedgehogDto } from './dto/update-hedgehog.dto'
import { PrismaService } from '../prisma/prisma.service'

import { Hedgehog, Prisma } from '@prisma/client'

@Injectable()
export class HedgehogService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.HedgehogCreateInput) {
    Logger.debug("Incoming Hedgehog.create:");
    Logger.debug(data);

    return this.prisma.hedgehog.create({
      data,
    })
  }

  findAll() {
    return this.prisma.hedgehog.findMany()
  }

  findOne(id: Prisma.HedgehogWhereUniqueInput) {
    return this.prisma.hedgehog.findUnique( 
      { where: id }
    )
  }

  update(id: Prisma.HedgehogWhereUniqueInput, updateData: Prisma.HedgehogUpdateInput) {
    
    return this.prisma.hedgehog.update({
      where: id, data: updateData
    }
    );
  }

  remove(id: Prisma.HedgehogWhereUniqueInput) {
    return this.prisma.hedgehog.delete( 
      { where: id }
    )
  }
}
