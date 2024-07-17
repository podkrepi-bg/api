import {
  CampaignApplicationFileRole,
  CampaignApplicationState,
  CampaignTypeCategory,
} from '@prisma/client'
import { CreateCampaignApplicationDto } from '../dto/create-campaign-application.dto'
import { Readable } from 'stream'

export const mockNewCampaignApplication = {
  campaignName: 'Test Campaign',
  organizerName: 'Test Organizer',
  organizerEmail: 'testemail@gmail.com',
  organizerPhone: '123456789',
  beneficiary: 'Test beneficary',
  organizerBeneficiaryRel: 'Test organizerBeneficiaryRel',
  goal: 'Test goal',
  history: 'Test history',
  amount: '1000',
  description: 'Test description',
  campaignGuarantee: 'Test guarantee',
  otherFinanceSources: 'Test otherFinanceSources',
  otherNotes: 'Test otherNotes',
  category: CampaignTypeCategory.medical,
}

const dto: CreateCampaignApplicationDto = {
  ...mockNewCampaignApplication,
  acceptTermsAndConditions: true,
  transparencyTermsAccepted: true,
  personalInformationProcessingAccepted: true,
  toEntity: new CreateCampaignApplicationDto().toEntity,
}

export const mockCampaigns = [
  {
    id: '1',
    createdAt: new Date('2022-04-08T06:36:33.661Z'),
    updatedAt: new Date('2022-04-08T06:36:33.662Z'),
    description: 'Test description1',
    organizerId: 'testOrganizerId1',
    organizerName: 'Test Organizer1',
    organizerEmail: 'organizer1@example.com',
    beneficiary: 'test beneficary1',
    organizerPhone: '123456789',
    organizerBeneficiaryRel: 'Test Relation1',
    campaignName: 'Test Campaign1',
    goal: 'Test Goal1',
    history: 'test history1',
    amount: '1000',
    campaignGuarantee: 'test campaignGuarantee1',
    otherFinanceSources: 'test otherFinanceSources1',
    otherNotes: 'test otherNotes1',
    state: CampaignApplicationState.review,
    category: CampaignTypeCategory.medical,
    ticketURL: 'testsodifhso1',
    archived: false,
  },
  {
    id: '2',
    createdAt: new Date('2022-04-08T06:36:33.661Z'),
    updatedAt: new Date('2022-04-08T06:36:33.662Z'),
    description: 'Test description2',
    organizerId: 'testOrganizerId2',
    organizerName: 'Test Organizer2',
    organizerEmail: 'organizer2@example.com',
    beneficiary: 'test beneficary2',
    organizerPhone: '123456789',
    organizerBeneficiaryRel: 'Test Relation2',
    campaignName: 'Test Campaign2',
    goal: 'Test Goal2',
    history: 'test history2',
    amount: '1000',
    campaignGuarantee: 'test campaignGuarantee2',
    otherFinanceSources: 'test otherFinanceSources2',
    otherNotes: 'test otherNotes2',
    state: CampaignApplicationState.review,
    category: CampaignTypeCategory.medical,
    ticketURL: 'testsodifhso2',
    archived: false,
  },
]

export const mockCreatedCampaignApplication = {
  id: 'mockCampaignApplicationId',
  createdAt: new Date('2022-04-08T06:36:33.661Z'),
  updatedAt: new Date('2022-04-08T06:36:33.662Z'),
  ...mockNewCampaignApplication,
  organizerId: 'mockOrganizerId',
  state: CampaignApplicationState.review,
  ticketURL: null,
  archived: false,
}
export const mockCampaignApplicationFile = {
  id: 'mockCampaignApplicationFileId',
  filename: 'test.pdf',
  mimetype: 'application/pdf',
  campaignApplicationId: 'mockCampaignApplicationId',
  personId: 'mockPersonId',
  role: CampaignApplicationFileRole.document,
}
export const mockCampaignApplicationUploadFile = {
  bucketName: 'campaignapplication-files',
  ...mockCampaignApplicationFile,

  campaignApplicationId: 'mockCampaignApplicationId',
  personId: 'mockPersonId',
}
export const mockCampaignApplicationFiles: Express.Multer.File[] = [
  {
    fieldname: 'resume',
    originalname: 'john_doe_resume.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 102400,
    stream: new Readable(),
    destination: '/uploads/resumes',
    filename: 'john_doe_resume_1234.pdf',
    path: '/uploads/resumes/john_doe_resume_1234.pdf',
    buffer: Buffer.from(''),
  },
  {
    fieldname: 'cover_letter',
    originalname: 'john_doe_cover_letter.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 51200,
    stream: new Readable(),
    destination: '/uploads/cover_letters',
    filename: 'john_doe_cover_letter_1234.pdf',
    path: '/uploads/cover_letters/john_doe_cover_letter_1234.pdf',
    buffer: Buffer.from(''),
  },
]
