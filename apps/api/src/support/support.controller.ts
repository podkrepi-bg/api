import { Body, Controller, Logger, Post, ValidationPipe } from '@nestjs/common'

import { CreateRequestDto } from './create-request.dto'
import { SupportService } from './support.service'

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  private readonly logger = new Logger(SupportController.name)

  @Post('create-request')
  async createRequest(@Body() createDto: CreateRequestDto) {
    const hash = Math.random().toString(36).substring(7)

    const entity = CreateRequestDto.toEntity(createDto)
    console.log(entity)
    // const data = Prisma.validator<Prisma.SupportRequestCreateInput>()(entity)

    // this.logger.log(data)
    // this.logger.log(createDto)

    return await this.supportService.createSupportRequest(
      {
        firstName: 'John',
        lastName: 'Doe',
        email: `john.doe+${hash}@example.com`,
        phone: '+359000000000',
        company: null,
      },
      {
        roles: ['benefactor', 'partner', 'associationMember', 'company', 'volunteer'],
      },
    )
  }

  @Post('create-inquiry')
  async createInquiry() {
    const hash = Math.random().toString(36).substring(7)
    return await this.supportService.createSupportInquiry(
      {
        firstName: 'John',
        lastName: 'Doe',
        email: `john.doe+${hash}@example.com`,
        phone: '+359000000000',
        company: 'Doe Ltd.',
      },
      'test best west',
    )
  }
}
