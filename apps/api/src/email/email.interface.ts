export type EmailData = string | { name?: string; email: string };

export interface Email {
  to: EmailData[];
  cc?: EmailData[];
  from: EmailData;
  subject: string;
  html: string;
}
