import { Invoice } from '@prisma/client';

export type InvoiceInput = Omit<
  Invoice,
  'id' | 'senderEmailAddress' | 'senderEmailId' | 'userId'
> & { labels: { connect: { id: string }[] } } & {
  senderEmail: { connect: { id: string } };
} & {
  user: { connect: { id: string } };
};
