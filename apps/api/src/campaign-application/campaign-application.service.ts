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
import { CampaignApplicationFileRole, Person, Prisma } from '@prisma/client'
import { S3Service } from './../s3/s3.service'
import { CreateCampaignApplicationFileDto } from './dto/create-campaignApplication-file.dto'
import { EmailService } from '../email/email.service'
import { EmailData } from '../email/email.interface'
import {
  CreateCampaignApplicationAdminEmailDto,
  CreateCampaignApplicationOrganizerEmailDto,
} from '../email/template.interface'
import { ConfigService } from '@nestjs/config'

function dateMaybe(d?: string) {
  return d != null &&
    typeof d === 'string' &&
    new Date(d).toString() != new Date('----invalid date ---').toString()
    ? new Date(d)
    : undefined
}

@Injectable()
export class CampaignApplicationService {
  private readonly bucketName: string = 'campaignapplication-files'
  constructor(
    private prisma: PrismaService,
    private organizerService: OrganizerService,
    private s3: S3Service,
    private emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async create(createCampaignApplicationDto: CreateCampaignApplicationDto, person: Person) {
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
        campaignTypeId: createCampaignApplicationDto.campaignTypeId,
        organizerId: organizer.id,
        campaignEnd: createCampaignApplicationDto.campaignEnd,
        campaignEndDate: dateMaybe(createCampaignApplicationDto.campaignEndDate),
      }

      const newCampaignApplication = await this.prisma.campaignApplication.create({
        data: campaingApplicationData,
      })

      await this.sendEmailsOnCreatedCampaignApplication(
        newCampaignApplication.campaignName,
        newCampaignApplication.id,
        person,
      )

      return newCampaignApplication
    } catch (error) {
      Logger.error('Error in create():', error)
      throw error
    }
  }

  async sendEmailsOnCreatedCampaignApplication(
    campaignApplicationName: string,
    campaignApplicationId: string,
    person: Person,
  ) {
    const adminMail = this.configService.get('CAMPAIGN_COORDINATOR_EMAIL', '')
    const userEmail = { to: [person.email] as EmailData[] }
    const adminEmail = { to: [adminMail] as EmailData[] }
    // const adminEmail = { to: ['martbul01@gmail.com'] as EmailData[] }

    const emailAdminData = {
      campaignApplicationName,
      campaignApplicationLink: `${this.configService.get(
        'APP_URL',
      )}/admin/campaigns/edit/${campaignApplicationId}`,
      email: person.email as string,
      firstName: person.firstName,
    }

    const emailOrganizerData = {
      campaignApplicationName,
      campaignApplicationLink: `${this.configService.get(
        'APP_URL',
      )}/campaigns/application/${campaignApplicationId}`,
      email: person.email as string,
      firstName: person.firstName,
    }

    const mailAdmin = new CreateCampaignApplicationAdminEmailDto(emailAdminData)
    const mailOrganizer = new CreateCampaignApplicationOrganizerEmailDto(emailOrganizerData)

    try {
      const userEmailPromise = this.emailService.sendFromTemplate(mailOrganizer, userEmail, {
        bypassUnsubscribeManagement: { enable: true },
      })

      const adminEmailPromise = this.emailService.sendFromTemplate(mailAdmin, adminEmail, {
        bypassUnsubscribeManagement: { enable: true },
      })

      await Promise.allSettled([userEmailPromise, adminEmailPromise])
    } catch (error) {
      Logger.error('Error in sendEmailsOnCreatedCampaignApplication():', error)
      throw error
    }
  }

  async uploadFiles(id: string, person: Person, files: Express.Multer.File[]) {
    try {
      const createdFiles = await Promise.all(
        files.map((file) => this.campaignApplicationFilesCreate(file, person.id, id)),
      )
      return createdFiles
    } catch (error) {
      Logger.error('Error in uploadFiles():', error)
      throw error
    }
  }

  async findAll() {
    try {
      const campaignApplications = await this.prisma.campaignApplication.findMany()
      return campaignApplications
    } catch (error) {
      Logger.error('Error in findAll():', error)
      throw error
    }
  }

  async findOne(
    id: string,
    isAdminFlag: boolean,
    person: Prisma.PersonGetPayload<{ include: { organizer: { select: { id: true } } } }>,
  ) {
    try {
      const singleCampaignApplication = await this.prisma.campaignApplication.findUnique({
        where: { id },
        include: {
          documents: {
            select: {
              id: true,
              filename: true,
              mimetype: true,
            },
          },
        },
      })
      if (!singleCampaignApplication) {
        throw new NotFoundException('Campaign application doesnt exist')
      }

      if (isAdminFlag === false && singleCampaignApplication.organizerId !== person.organizer?.id) {
        throw new ForbiddenException('User is not admin or organizer of the campaignApplication')
      }

      return singleCampaignApplication
    } catch (error) {
      Logger.error('Error in findOne():', error)
      throw error
    }
  }

  async deleteFile(
    id: string,
    isAdminFlag: boolean,
    person: Prisma.PersonGetPayload<{ include: { organizer: { select: { id: true } } } }>,
  ) {
    try {
      const campaignApplication = await this.prisma.campaignApplication.findFirst({
        where: {
          documents: {
            some: {
              id: id,
            },
          },
        },
      })

      if (!campaignApplication) {
        throw new NotFoundException('File does not exist')
      }

      if (isAdminFlag === false && campaignApplication.organizerId !== person.organizer?.id) {
        throw new ForbiddenException('User is not admin or organizer of the campaignApplication')
      }

      await this.prisma.campaignApplicationFile.delete({
        where: { id },
      })

      await this.s3.deleteObject(this.bucketName, id)
    } catch (error) {
      Logger.error('Error in deleteFile():', error)
      throw error
    }
    return 'Successfully deleted file'
  }

  async updateCampaignApplication(
    id: string,
    updateCampaignApplicationDto: UpdateCampaignApplicationDto,
    isAdminFlag: boolean,
    organizerId?: string,
  ) {
    const campaignApplication = await this.prisma.campaignApplication.findUnique({
      where: { id },
    })

    if (!campaignApplication) {
      throw new NotFoundException('Campaign application doesnt exist')
    }

    if (isAdminFlag == false && organizerId !== campaignApplication.organizerId) {
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
          campaignTypeId: updateCampaignApplicationDto?.campaignTypeId,
          campaignEnd: updateCampaignApplicationDto.campaignEnd,
          campaignEndDate: dateMaybe(updateCampaignApplicationDto.campaignEndDate),
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
          campaignTypeId: updateCampaignApplicationDto?.campaignTypeId,
          state: updateCampaignApplicationDto?.state,
          ticketURL: updateCampaignApplicationDto?.ticketURL,
          archived: updateCampaignApplicationDto?.archived,
          campaignEnd: updateCampaignApplicationDto.campaignEnd,
          campaignEndDate: dateMaybe(updateCampaignApplicationDto.campaignEndDate),
        },
      })
    }

    return editedCampaignApplication
  }

  remove(id: string) {
    return `This action removes a #${id} campaignApplication`
  }

  async campaignApplicationFilesCreate(
    file: Express.Multer.File,
    personId: string,
    campaignApplicationId: string,
  ) {
    const fileDto: CreateCampaignApplicationFileDto = {
      filename: file.originalname,
      mimetype: file.mimetype,
      campaignApplicationId: campaignApplicationId,
      personId,
      role: CampaignApplicationFileRole.document,
    }

    try {
      const createFileInDb = await this.prisma.campaignApplicationFile.create({
        data: fileDto,
      })

      await this.s3.uploadObject(
        this.bucketName,
        createFileInDb.id,
        file.originalname,
        file.mimetype,
        file.buffer,
        'CampaignApplicationFile',
        campaignApplicationId,
        personId,
      )
      return createFileInDb
    } catch (error) {
      Logger.error('Error in campaignApplicationFilesCreate():', error)
      throw error
    }
  }

  async getFile(
    id: string,
    isAdminFlag: boolean,
    person: Prisma.PersonGetPayload<{ include: { organizer: { select: { id: true } } } }>,
  ) {
    try {
      const campaignApplication = await this.prisma.campaignApplication.findFirst({
        where: {
          documents: {
            some: {
              id: id,
            },
          },
        },
      })

      if (!campaignApplication) {
        throw new NotFoundException('File does not exist')
      }

      if (isAdminFlag === false && campaignApplication.organizerId !== person.organizer?.id) {
        throw new ForbiddenException('User is not admin or organizer of the campaignApplication')
      }

      const file = await this.prisma.campaignApplicationFile.findFirst({ where: { id: id } })
      if (!file) {
        Logger.warn('No campaign application file record with ID: ' + id)
        throw new NotFoundException('No campaign application file record with ID: ' + id)
      }

      return {
        filename: encodeURIComponent(file.filename),
        mimetype: file.mimetype,
        stream: await this.s3.streamFile(this.bucketName, id),
      }
    } catch (error) {
      Logger.error('Error in getFile():', error)
      throw error
    }
  }
}
