import { Invoice } from '@prisma/client';

export type InvoiceInput = Omit<
  Invoice,
  'id' | 'senderEmailAddress' | 'senderEmailId' | 'userId' | 'categoryId'
> & { category: { connect: { id: string } } } & {
  senderEmail: { connect: { id: string } };
} & {
  user: { connect: { id: string } };
};
