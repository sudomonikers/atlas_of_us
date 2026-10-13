import { request } from '../auth/api';

//every /admin route needs a Person with admin: true, anyone else gets a 403

export interface Contact {
  name: string | null;
  address: string;
}

export interface EmailSummary {
  id: string;
  from: Contact | null;
  subject: string;
  received_at: string;
  preview: string;
  replied: boolean;
}

export interface Attachment {
  name: string;
  content_type: string | null;
  size: number; //bytes
}

export interface Reply {
  from: string;
  to: string;
  subject: string;
  body: string;
  sent_at: string;
  sent_by: string; //the admin's username
}

export interface Email {
  id: string;
  from: Contact | null;
  to: Contact[];
  cc: Contact[];
  reply_to: Contact | null;
  subject: string;
  date: string | null; //what the sender's Date header claims
  received_at: string;
  text: string | null;
  html: string | null;
  attachments: Attachment[];
  spam_verdict: string | null; //PASS, FAIL, GRAY or PROCESSING_FAILED
  virus_verdict: string | null;
  replies: Reply[];
}

//newest first
export const listEmails = () => request<EmailSummary[]>('GET', '/admin/emails');

export const getEmail = (id: string) => request<Email>('GET', `/admin/emails/${encodeURIComponent(id)}`);

export const replyToEmail = (id: string, body: string) =>
  request<Reply>('POST', `/admin/emails/${encodeURIComponent(id)}/reply`, { body });
