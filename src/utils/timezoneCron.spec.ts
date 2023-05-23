import { convertCronToUTC } from './timezoneCron';

describe('convertCronToUTC', () => {
  it('should return correct cron string', () => {
    const res = convertCronToUTC('0 21 * * *', 'Asia/Jakarta');
    expect(res).toBe('0 14 * * *');
  });
  it('should not return hours above 23 or below 0', () => {
    const res = convertCronToUTC('0 5 * * *', 'Asia/Jakarta');
    expect(res).toBe('0 22 * * *');
  });
});
