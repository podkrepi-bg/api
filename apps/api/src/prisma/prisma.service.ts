import { PrismaClient } from '@prisma/client'
import { Injectable, OnModuleInit } from '@nestjs/common'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    this.$use(async (params, next) => {
      if (params.model == 'Expense') {
        if (params.action == 'delete') {
          params.action = 'update'
          params.args['data'] = { deleted: true }
        }
      }
      return next(params)
    })

    await this.$connect()
  }
}
