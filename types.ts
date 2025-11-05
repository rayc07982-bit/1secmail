
export interface Email {
  id: number;
  from: string;
  subject: string;
  date: string;
}

export interface EmailBody {
  id: number;
  from: string;
  subject: string;
  date: string;
  attachments: {
    filename: string;
    contentType: string;
    size: number;
  }[];
  body: string;
  textBody: string;
  htmlBody: string;
}
