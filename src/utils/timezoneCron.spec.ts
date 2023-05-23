import { convertCronToUTC } from './timezoneCron';

describe('convertCronToUTC', () => {
  it('should return correct cron string', () => {
    const res = convertCronToUTC('0 21 * * *', 'Asia/Jakarta');
    expect(res).toBe('0 14 * * *');
  });
});
