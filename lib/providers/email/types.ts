export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  idempotencyKey?: string;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
