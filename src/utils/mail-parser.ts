import { gmail_v1 } from 'googleapis';
import { convert } from 'html-to-text';

interface EmailData {
  emailId: string;
  amount: number;
  otherAmounts: number[];
  senderEmailAddress: string;
  emailCreated: Date;
  summary: string;
  emailContent: string;
  currency: string;
}

export function parseEmailsForInvoiceAmounts(
  email: gmail_v1.Schema$Message,
  currency: string,
): EmailData | null {
  // Extract the email body depending on the content type
  let emailBody = '';
  if (email.payload.mimeType === 'text/plain') {
    emailBody = email.payload.body.data;
  } else if (email.payload.mimeType === 'multipart/alternative') {
    const part = email.payload.parts.find(
      (part) => part.mimeType === 'text/html',
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

  const getNumberValue = (val: string): number => {
    const captureRegex = new RegExp(`[${currencyLiteral},.]`, 'g');
    const numberStr = val.replace(/(\.00)$/, '').replace(captureRegex, '');
    return parseFloat(numberStr);
  };
  const htmlText = convert(decodedBody, {
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
    ],
  });

  const summary = email.snippet;
  const summaryMatch = summary.match(regex);
  const match = htmlText.match(regex);
  if (summaryMatch) {
    const floatValues = summaryMatch.map(getNumberValue);
    const estimatedAmount = Math.max(...floatValues);
    return {
      emailId: email.id,
      senderEmailAddress: getSenderEmailAddress(email.payload),
      emailCreated: new Date(Number(email.internalDate)),
      summary,
      emailContent: htmlText,
      amount: estimatedAmount,
      otherAmounts: floatValues,
      currency,
    };
  } else if (match) {
    const floatValues = match.map(getNumberValue);
    // Try to get total amount by getting highest count value, and getting the bigger value
    const estimatedAmount = findHighestCount(floatValues);
    return {
      emailId: email.id,
      senderEmailAddress: getSenderEmailAddress(email.payload),
      emailCreated: new Date(Number(email.internalDate)),
      summary,
      emailContent: htmlText,
      amount: estimatedAmount,
      otherAmounts: floatValues,
      currency,
    };
  } else {
    return null;
  }
}

export function getSenderEmailAddress(payload: gmail_v1.Schema$MessagePart) {
  const headers = payload.headers;

  // Find the "From" header
  const fromHeader = headers.find(
    (header) => header.name.toLowerCase() === 'from',
  );

  if (!fromHeader) {
    return null;
  }

  // Extract the email address using a regular expression
  const emailRegex = /[^@<\s]+@[^@\s>]+/;
  const match = fromHeader.value.match(emailRegex);

  return match ? match[0] : null;
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
  const keywordsQuery = keywords
    .map((keyword) => `subject:${keyword}`)
    .join(' OR ');

  // Format the fromDate as a string
  const formattedFromDate = fromDate.toISOString().split('T')[0];
  const fromDateQuery = `after:${formattedFromDate}`;

  const queryString = `${fromQueries.join(
    ' OR ',
  )} ${keywordsQuery} ${fromDateQuery}`;
  return queryString.trim();
}

function findHighestCount(numbers: number[]): number {
  const counts = new Map();

  for (const number of numbers) {
    counts.set(number, (counts.get(number) || 0) + 1);
  }

  let maxCount = 0;
  let maxValue = -Infinity;

  for (const [number, count] of counts.entries()) {
    if (count > maxCount || (count === maxCount && number > maxValue)) {
      maxCount = count;
      maxValue = number;
    }
  }

  return maxValue;
}
