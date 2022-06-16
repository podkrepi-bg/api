import 'multer'
import {
  Controller,
  Get,
  Post,
  Response,
  Param,
  Delete,
  Inject,
  forwardRef,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common'

import { FilesInterceptor } from '@nestjs/platform-express'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { Roles, RoleMatchingMode, Public } from 'nest-keycloak-connect'

import { PersonService } from '../person/person.service'
import { IrregularityFileService } from './irregularity-file.service'
import { RealmViewContactRequests, ViewContactRequests } from '@podkrepi-bg/podkrepi-types'
import { IrregularityService } from '../irregularity/irregularity.service'

@Controller('irregularity-file')
export class IrregularityFileController {
  constructor(
    private readonly irregularityFileService: IrregularityFileService,
    @Inject(forwardRef(() => PersonService)) private readonly personService: PersonService,
    private readonly irregularityService: IrregularityService,
  ) {}

  @Post(':irregularity_id')
  @Public()
  @UseInterceptors(FilesInterceptor('file', 5, { limits: { fileSize: 10485760 } })) //limit uploaded files to 5 at once and 10MB each
  async create(
    @Param('irregularity_id') irregularityId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const irregularity = await this.irregularityService.getIrregularityById(irregularityId)
    if (!irregularity) {
      throw new NotFoundException('No irregularity found with id: ' + irregularityId)
    }

    const person = await this.personService.findOne(irregularity.personId)
    if (!person) {
      throw new NotFoundException('No person record with id: ' + irregularity.personId)
    }
    return await Promise.all(
      files.map((file) => {
        return this.irregularityFileService.create(
          irregularityId,
          file.mimetype,
          file.originalname,
          person,
          file.buffer,
        )
      }),
    )
  }

  //TODO: define custom admin role for campaign report files

  @Get('list/:irregularity_id')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async getFilesByIrregularityId(@Param('irregularity_id') irregularityId: string) {
    return await this.irregularityFileService.findMany(irregularityId)
  }

  @Get(':id')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  async findOne(
    @Param('id') id: string,
    @Response({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    const file = await this.irregularityFileService.findOne(id)
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': 'attachment; filename="' + file.filename + '"',
    })
    return new StreamableFile(file.stream)
  }

  @Delete(':id')
  @Roles({
    roles: [RealmViewContactRequests.role, ViewContactRequests.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.irregularityFileService.remove(id)
  }
}
