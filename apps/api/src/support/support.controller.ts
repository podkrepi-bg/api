import { Controller, Get } from '@nestjs/common';

import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('create-request')
  async createRequest() {
    const hash = Math.random().toString(36).substring(7);
    return await this.supportService.createSupportRequest(
      {
        firstName: 'John',
        lastName: 'Doe',
        email: `john.doe+${hash}@example.com`,
        phone: '+359000000000',
        company: null,
      },
      {
        roles: [
          'benefactor',
          'partner',
          'associationMember',
          'company',
          'volunteer',
        ],
      }
    );
  }

  @Get('create-inquiry')
  async createInquiry() {
    const hash = Math.random().toString(36).substring(7);
    return await this.supportService.createSupportInquiry(
      {
        firstName: 'John',
        lastName: 'Doe',
        email: `john.doe+${hash}@example.com`,
        phone: '+359000000000',
        company: 'Doe Ltd.',
      },
      'test best west'
    );
  }
}
