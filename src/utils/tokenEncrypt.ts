import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
const algorithm = 'aes-256-ctr';

export const encrypt = (text: string): string => {
  const iv = randomBytes(16);
  const cipher = createCipheriv(
    algorithm,
    Buffer.from(process.env.SECRET_KEY, 'hex'),
    iv,
  );

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return iv.toString('hex') + '_' + encrypted.toString('hex');
};

export const decrypt = (hash: string): string => {
  const [iv, content] = hash.split('_');
  const decipher = createDecipheriv(
    algorithm,
    Buffer.from(process.env.SECRET_KEY, 'hex'),
    Buffer.from(iv, 'hex'),
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(content, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString();
};
