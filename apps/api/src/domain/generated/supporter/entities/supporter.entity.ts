
import {Person} from '../../person/entities/person.entity'


export class Supporter {
  id: string ;
personId: string ;
createdAt: Date ;
updatedAt: Date  | null;
deletedAt: Date  | null;
comment: string  | null;
associationMember: boolean ;
benefactorCampaign: boolean ;
benefactorPlatform: boolean ;
companyOtherText: string  | null;
companySponsor: boolean ;
companyVolunteer: boolean ;
partnerBussiness: boolean ;
partnerNpo: boolean ;
partnerOtherText: string  | null;
roleAssociationMember: boolean ;
roleBenefactor: boolean ;
roleCompany: boolean ;
rolePartner: boolean ;
roleVolunteer: boolean ;
volunteerBackend: boolean ;
volunteerDesigner: boolean ;
volunteerDevOps: boolean ;
volunteerFinancesAndAccounts: boolean ;
volunteerFrontend: boolean ;
volunteerLawyer: boolean ;
volunteerMarketing: boolean ;
volunteerProjectManager: boolean ;
volunteerQa: boolean ;
volunteerSecurity: boolean ;
person?: Person ;
}
