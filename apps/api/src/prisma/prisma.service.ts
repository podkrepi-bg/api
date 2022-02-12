import { PrismaClient } from '@prisma/client'
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {

    this.$use(async (params, next) => {
      if (params.model == 'Expense') {
        if (params.action == 'delete') {
          params.action = 'update'
          params.args['data'] = { deleted: true }
        }
        if (params.action == 'deleteMany') {
          params.action = 'updateMany'
          if (params.args.data != undefined) {
            params.args.data['deleted'] = true
          } else {
            params.args['data'] = { deleted: true }
          }
        }
      }
      return next(params)
    })

    await this.$connect()
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close()
    })
  }
}
