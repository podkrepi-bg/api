import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { CreateCampaignApplicationDto } from './dto/create-campaign-application.dto'
import { UpdateCampaignApplicationDto } from './dto/update-campaign-application.dto'
import { PrismaService } from '../prisma/prisma.service'
import { OrganizerService } from '../organizer/organizer.service'
import { CampaignApplicationFileRole, Person } from '@prisma/client'
import { S3Service } from './../s3/s3.service'
import { CreateCampaignApplicationFileDto } from './dto/create-campaignApplication-file.dto'
@Injectable()
export class CampaignApplicationService {
  private readonly bucketName: string = 'campaignapplication-files'
  constructor(
    private prisma: PrismaService,
    private organizerService: OrganizerService,
    private s3: S3Service,
  ) {}

  async getCampaignByIdWithPersonIds(id: string): Promise<UpdateCampaignApplicationDto> {
    throw new Error('Method not implemented.')
  }

  async create(
    createCampaignApplicationDto: CreateCampaignApplicationDto,
    person: Person,
    files: Express.Multer.File[],
  ) {
    try {
      if (
        createCampaignApplicationDto.acceptTermsAndConditions === false ||
        createCampaignApplicationDto.transparencyTermsAccepted === false ||
        createCampaignApplicationDto.personalInformationProcessingAccepted === false
      ) {
        throw new BadRequestException('All agreements must be checked')
      }

      let organizer = await this.prisma.organizer.findUnique({
        where: { personId: person.id },
      })

      if (!organizer) {
        organizer = await this.organizerService.create({
          personId: person.id,
        })
      }

      const campaingApplicationData = {
        campaignName: createCampaignApplicationDto.campaignName,
        organizerName: createCampaignApplicationDto.organizerName,
        organizerEmail: createCampaignApplicationDto.organizerEmail,
        organizerPhone: createCampaignApplicationDto.organizerPhone,
        beneficiary: createCampaignApplicationDto.beneficiary,
        organizerBeneficiaryRel: createCampaignApplicationDto.organizerBeneficiaryRel,
        goal: createCampaignApplicationDto.goal,
        history: createCampaignApplicationDto.history,
        amount: createCampaignApplicationDto.amount,
        description: createCampaignApplicationDto.description,
        campaignGuarantee: createCampaignApplicationDto.campaignGuarantee,
        otherFinanceSources: createCampaignApplicationDto.otherFinanceSources,
        otherNotes: createCampaignApplicationDto.otherNotes,
        category: createCampaignApplicationDto.category,
        organizerId: organizer.id,
      }

      const newCampaignApplication = await this.prisma.campaignApplication.create({
        data: campaingApplicationData,
      })

      if (files) {
        await Promise.all(
          files.map((file) => {
            return this.campaignApplicationFilesCreate(file, person.id, newCampaignApplication.id)
          }),
        )
      }

      return newCampaignApplication
    } catch (error) {
      Logger.error('Error in create():', error)
      throw error
    }
  }

  findAll() {
    return this.prisma.campaignApplication.findMany()
  }

  findOne(id: string) {
    return `This action returns a #${id} campaignApplication`
  }

  async updateCampaignApplication(
    id: string,
    personId: string,
    updateCampaignApplicationDto: UpdateCampaignApplicationDto,
    isAdminFlag: boolean,
    organaizerId?: string,
    files?: Express.Multer.File[],
  ) {
    console.log(id)

    const campaignApplication = await this.prisma.campaignApplication.findUnique({
      where: { id },
    })

    if (!campaignApplication) {
      throw new NotFoundException('Campaign application doesnt exist')
    }

    if (isAdminFlag == false && organaizerId !== campaignApplication.organizerId) {
      throw new ForbiddenException('User is not organizer of the campaignApplication')
    }

    let editedCampaignApplication
    if (isAdminFlag === false) {
      editedCampaignApplication = await this.prisma.campaignApplication.update({
        where: { id: id },
        data: {
          campaignName: updateCampaignApplicationDto?.campaignName,
          organizerName: updateCampaignApplicationDto?.organizerName,
          organizerEmail: updateCampaignApplicationDto?.organizerEmail,
          organizerPhone: updateCampaignApplicationDto?.organizerPhone,
          beneficiary: updateCampaignApplicationDto?.beneficiary,
          organizerBeneficiaryRel: updateCampaignApplicationDto?.organizerBeneficiaryRel,
          goal: updateCampaignApplicationDto?.goal,
          history: updateCampaignApplicationDto?.history,
          amount: updateCampaignApplicationDto?.amount,
          description: updateCampaignApplicationDto?.description,
          campaignGuarantee: updateCampaignApplicationDto?.campaignGuarantee,
          otherFinanceSources: updateCampaignApplicationDto?.otherFinanceSources,
          otherNotes: updateCampaignApplicationDto?.otherNotes,
          category: updateCampaignApplicationDto?.category,
        },
      })

      delete editedCampaignApplication.state
      delete editedCampaignApplication.ticketURL
      delete editedCampaignApplication.archived
    } else {
      editedCampaignApplication = await this.prisma.campaignApplication.update({
        where: { id: id },
        data: {
          campaignName: updateCampaignApplicationDto?.campaignName,
          organizerName: updateCampaignApplicationDto?.organizerName,
          organizerEmail: updateCampaignApplicationDto?.organizerEmail,
          organizerPhone: updateCampaignApplicationDto?.organizerPhone,
          beneficiary: updateCampaignApplicationDto?.beneficiary,
          organizerBeneficiaryRel: updateCampaignApplicationDto?.organizerBeneficiaryRel,
          goal: updateCampaignApplicationDto?.goal,
          history: updateCampaignApplicationDto?.history,
          amount: updateCampaignApplicationDto?.amount,
          description: updateCampaignApplicationDto?.description,
          campaignGuarantee: updateCampaignApplicationDto?.campaignGuarantee,
          otherFinanceSources: updateCampaignApplicationDto?.otherFinanceSources,
          otherNotes: updateCampaignApplicationDto?.otherNotes,
          category: updateCampaignApplicationDto?.category,
          state: updateCampaignApplicationDto?.state,
          ticketURL: updateCampaignApplicationDto?.ticketURL,
          archived: updateCampaignApplicationDto?.archived,
        },
      })
    }

    if (files) {
      const existingCampaignApplicationFiles = await this.prisma.campaignApplicationFile.findMany({
        where: { campaignApplicationId: id },
      })

      for (const file of existingCampaignApplicationFiles) {
        await this.s3.deleteObject(this.bucketName, file.id)
      }

      await this.prisma.campaignApplicationFile.deleteMany({
        where: { campaignApplicationId: id },
      })

      await Promise.all(
        files.map((file) => {
          return this.campaignApplicationFilesCreate(file, personId, campaignApplication.id)
        }),
      )
    }

    return editedCampaignApplication
  }

  remove(id: string) {
    return `This action removes a #${id} campaignApplication`
  }

  async campaignApplicationFilesCreate(file, personId: string, campaignApplicationId: string) {
    const fileDto: CreateCampaignApplicationFileDto = {
      filename: file.originalname,
      mimetype: file.mimetype,
      campaignApplicationId: campaignApplicationId,
      personId,
      role: CampaignApplicationFileRole.document,
    }

    const createFileInDb = await this.prisma.campaignApplicationFile.create({
      data: fileDto,
    })

    await this.s3.uploadObject(
      this.bucketName,
      createFileInDb.id,
      file.filename,
      file.mimetype,
      file.buffer,
      'CampaignApplicationFile',
      campaignApplicationId,
      personId,
    )
  }
}
