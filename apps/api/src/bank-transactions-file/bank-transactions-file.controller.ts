import { Controller, Get, Post, Body, Param, Response, Delete, StreamableFile, forwardRef, Inject, Logger, NotFoundException } from '@nestjs/common';
import { BankTransactionsFileService } from './bank-transactions-file.service';
import 'multer'
import { FilesInterceptor } from '@nestjs/platform-express'
import { UseInterceptors, UploadedFiles } from '@nestjs/common'
import { AuthenticatedUser, Public, RoleMatchingMode, Roles } from 'nest-keycloak-connect';
import { RealmViewSupporters, ViewSupporters } from '@podkrepi-bg/podkrepi-types';
import { FilesRoleDto } from './dto/files-role.dto';
import { KeycloakTokenParsed } from '../auth/keycloak';
import { PersonService } from '../person/person.service';
import { DonationsService } from '../donations/donations.service';


@Controller('bank-transactions-file')
export class BankTransactionsFileController {
  constructor(private readonly bankTransactionsFileService: BankTransactionsFileService,
    @Inject(forwardRef(() => PersonService)) private readonly personService: PersonService,
    private readonly DonationsService: DonationsService,

    ) {}

  @Post(':bank_transactions_file_id')
  @UseInterceptors(FilesInterceptor('file'))
  async create(
    @Param('bank_transactions_file_id') bankTransactionsFileId: string,
    @Body() body: FilesRoleDto,
    @UploadedFiles() files: Express.Multer.File[],
    @AuthenticatedUser() user: KeycloakTokenParsed,
) {
  const keycloakId = user.sub as string
  const person = await this.personService.findOneByKeycloakId(keycloakId)
  if (!person) {
    Logger.warn('No person record with keycloak ID: ' + keycloakId)
    throw new NotFoundException('No person record with keycloak ID: ' + keycloakId)
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const parseString = require('xml2js').parseString;
  const xml = "<root>Hello xml2js!</root>"

  return await Promise.all(
    files.map((file,key) => {
      parseString(file.buffer, function (err, result) {
        console.log(result);
        for (const key in result) {
          console.log(result[key])
        }

      });
        const filesRole = body.roles
        return this.bankTransactionsFileService.create(
          Array.isArray(filesRole) ? filesRole[key] : filesRole,
          bankTransactionsFileId,
          file.mimetype,
          file.originalname,
          person,
          file.buffer,
        )

      }),
    )

  }

  @Get()
  findAll() {
    return this.bankTransactionsFileService.findAll();
  }

  @Get(':id')
  @Public()
  async findOne(
    @Param('id') id: string,
    @Response({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    const file = await this.bankTransactionsFileService.findOne(id)
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': 'attachment; filename="' + file.filename + '"',
    })

    return new StreamableFile(file.stream)
  }


  @Delete(':id')
  @Roles({
    roles: [RealmViewSupporters.role, ViewSupporters.role],
    mode: RoleMatchingMode.ANY,
  })
  remove(@Param('id') id: string) {
    return this.bankTransactionsFileService.remove(id)
  }
}
