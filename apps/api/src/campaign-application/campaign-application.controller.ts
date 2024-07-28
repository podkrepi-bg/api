import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ForbiddenException,
  NotFoundException,
  Logger,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { CampaignApplicationService } from './campaign-application.service'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { UpdateCampaignApplicationDto } from './dto/update-campaign-application.dto'
import { ApiTags } from '@nestjs/swagger'
import { AuthenticatedUser, RoleMatchingMode, Roles } from 'nest-keycloak-connect'
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types'
import { KeycloakTokenParsed, isAdmin } from '../auth/keycloak'
import { PersonService } from '../person/person.service'
import { FilesInterceptor } from '@nestjs/platform-express'
import { validateFileType } from '../common/files'

@ApiTags('campaign-application')
@Controller('campaign-application')
export class CampaignApplicationController {
  constructor(
    private readonly campaignApplicationService: CampaignApplicationService,
    private readonly personService: PersonService,
  ) {}

  @Post('create')
  @UseInterceptors(
    FilesInterceptor('file', 10, {
      limits: { fileSize: 1024 * 1024 * 30 },
      fileFilter: (_req: Request, file, cb) => {
        validateFileType(file, cb)
      },
    }),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createCampaignApplicationDto: CreateCampaignApplicationDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    const person = await this.personService.findOneByKeycloakId(user.sub)
    if (!person) {
      Logger.error('No person found in database')
      throw new NotFoundException('No person found in database')
    }

    return this.campaignApplicationService.create(createCampaignApplicationDto, person, files)
  }

  @Get('list')
  findAll(@AuthenticatedUser() user: KeycloakTokenParsed) {
    if (!isAdmin(user)) {
      throw new ForbiddenException('Must be admin to get all campaign-applications')
    }
    return this.campaignApplicationService.findAll()
  }

  @Get('byId/:id')
  findOne(@Param('id') id: string) {
    return this.campaignApplicationService.findOne(id)
  }

  @Patch(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  async update(
    @Param('id') id: string,
    @Body() updateCampaignApplicationDto: UpdateCampaignApplicationDto,
    @AuthenticatedUser() user: KeycloakTokenParsed,
  ) {
    return this.campaignApplicationService.update(id, updateCampaignApplicationDto)
  }
}
