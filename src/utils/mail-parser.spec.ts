import { parseEmailsForInvoiceAmounts } from './mail-parser';

describe('parseEmailsForInvoiceAmounts', () => {
  it('should return all amounts in number from email body', () => {
    const dataBuf = Buffer.from('<body>Your total amount is $ 2,500.00</body>');
    const email = {
      id: 'foo',
      payload: {
        mimeType: 'text/plain',
        body: {
          data: dataBuf.toString('base64'),
        },
        headers: [{ name: 'from', value: 'test@test.com' }],
      },
    };
    expect(parseEmailsForInvoiceAmounts(email, '$').amount).toBe(2500.0);
  });
  it('should return all amounts in number from email body for no decimals', () => {
    const dataBuf = Buffer.from('<body>Your total amount is Rp 45000</body>');
    const email = {
      id: 'foo',
      payload: {
        mimeType: 'text/plain',
        body: {
          data: dataBuf.toString('base64'),
        },
        headers: [{ name: 'from', value: 'test@test.com' }],
      },
    };
    expect(parseEmailsForInvoiceAmounts(email, 'Rp').amount).toBe(45000.0);
  });
  it('should return all other values but selectes the highest count as value', () => {
    const dataBuf = Buffer.from(
      '<body>Your total amount is $ 2,500.00 $ 2,111.00 $ 2,111.00 $ 2,500.00</body>',
    );
    const email = {
      id: 'foo',
      payload: {
        mimeType: 'text/plain',
        body: {
          data: dataBuf.toString('base64'),
        },
        headers: [{ name: 'from', value: 'test@test.com' }],
      },
    };
    const res = parseEmailsForInvoiceAmounts(email, '$');
    expect(res.amount).toBe(2500.0);
    expect(res.otherAmounts).toMatchObject([2500.0, 2111.0, 2111.0, 2500.0]);
  });
  it('should only return body without any img or links', () => {
    const dataBuf = Buffer.from(
      '<head>foo</head><body>Your total amount is <a href="foo.bar">$ 2,500.00</a> and $ 2,111.00<img src="foo.bar" /></body>',
    );
    const email = {
      id: 'foo',
      payload: {
        mimeType: 'text/plain',
        body: {
          data: dataBuf.toString('base64'),
        },
        headers: [{ name: 'from', value: 'test@test.com' }],
      },
    };
    const res = parseEmailsForInvoiceAmounts(email, '$');
    expect(res.emailContent).toBe(
      'Your total amount is $ 2,500.00 and $ 2,111.00',
    );
  });
});
