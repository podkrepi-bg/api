





export class CreatePersonDto {
  firstName: string;
lastName: string;
email: string;
emailConfirmed?: boolean;
phone?: string;
company?: string;
newsletter?: boolean;
adress?: string;
birthday?: Date;
personalNumber?: string;
keycloakId?: string;
stripeCustomerId?: string;
}
