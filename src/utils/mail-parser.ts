import { Invoice } from '@prisma/client';
import { gmail_v1 } from 'googleapis';

export function parseEmailsForInvoiceAmounts(
  email: gmail_v1.Schema$Message,
  currency: string,
  userId?: string,
): Invoice | null {
  // Extract the email body depending on the content type
  let emailBody = '';
  if (email.payload.mimeType === 'text/plain') {
    emailBody = email.payload.body.data;
  } else if (email.payload.mimeType === 'multipart/alternative') {
    const part = email.payload.parts.find(
      (part) => part.mimeType === 'text/plain',
    );
    if (part) {
      emailBody = part.body.data;
    }
  }

  // Decode the Base64URL encoded body data
  const decodedBody = Buffer.from(emailBody, 'base64url').toString('utf8');
  // Only checks for $ because it is a regex expression
  const currencyLiteral = currency === '$' ? '\\' + currency : currency;
  // Extract the invoice amount using a regular expression
  const regex = new RegExp(
    `(${currencyLiteral})\\s*([\\d,\\.]+(?:\\.\\d{1,2})?)`,
    'g',
  );
  const match = decodedBody.match(regex);
  if (match) {
    const floatValues = match.map((val) => {
      const captureRegex = new RegExp(`[${currencyLiteral},.]`, 'g');
      const numberStr = val.replace(/(\.00)$/, '').replace(captureRegex, '');
      return parseFloat(numberStr);
    });
    // Try to get total amount by getting max value, might not be accurate so store other values also
    const estimatedAmount = Math.max(...floatValues);
    return {
      emailId: email.id,
      amount: estimatedAmount,
      otherAmounts: floatValues,
      label: [],
      isValid: true,
      userId,
    };
  } else {
    return null;
  }
}

export function generateGmailQueryString(
  emailAddresses: string[],
  fromDate: Date,
  keywords: string[],
) {
  if (!emailAddresses || emailAddresses.length === 0) {
    return '';
  }

  const fromQueries = emailAddresses.map((email) => `from:${email}`);
  const keywordsQuery = keywords.map((keyword) => `("${keyword}")`).join(' ');

  // Format the fromDate as a string
  const formattedFromDate = fromDate.toISOString().split('T')[0];
  const fromDateQuery = `after:${formattedFromDate}`;

  const queryString = `${fromQueries.join(
    ' OR ',
  )} ${keywordsQuery} ${fromDateQuery}`;
  return queryString.trim();
}
