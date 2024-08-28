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
import { CreateCampaignApplicationEmailDto } from '../email/template.interface'

@Injectable()
export class CampaignApplicationService {
  private readonly bucketName: string = 'campaignapplication-files'
  constructor(
    private prisma: PrismaService,
    private organizerService: OrganizerService,
    private s3: S3Service,
    private sendEmail: EmailService,
  ) {}

  async getCampaignByIdWithPersonIds(id: string): Promise<UpdateCampaignApplicationDto> {
    throw new Error('Method not implemented.')
  }

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
        category: createCampaignApplicationDto.category,
        organizerId: organizer.id,
      }

      const newCampaignApplication = await this.prisma.campaignApplication.create({
        data: campaingApplicationData,
      })

       const userEmail = { to: [person.email] as EmailData[] }

       const emailData = {
         campaignApplicationName: newCampaignApplication.campaignName,
         editLink: 'https://www.formula1.com/',
        email: person.email,
        firstName: person.firstName,
    
       }

       const mail = new CreateCampaignApplicationEmailDto(emailData)

       await this.sendEmail.sendFromTemplate(mail, userEmail, {
         bypassUnsubscribeManagement: { enable: true },
       })

      return newCampaignApplication
    } catch (error) {
      Logger.error('Error in create():', error)
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

  async findOne(id: string, isAdminFlag: boolean, person: Prisma.PersonGetPayload<{ include: { organizer: {select:{id:true}}}}>) {
    try {
      const singleCampaignApplication = await this.prisma.campaignApplication.findUnique({
        where: { id },
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

  async deleteFile(id: string, isAdminFlag: boolean, person: Prisma.PersonGetPayload<{ include: { organizer: {select:{id:true}}}}>) {
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
}
