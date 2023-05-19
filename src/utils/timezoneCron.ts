export function convertCronToUTC(cron: string, timezone: string): string {
  const parts = cron.split(' ');

  if (parts.length !== 5) {
    throw new Error('Invalid cron string. Expected format is "* * * * *".');
  }

  const hours = parseInt(parts[2], 10);
  if (isNaN(hours) || hours < 0 || hours > 23) {
    throw new Error('Invalid hours value. Expected a number between 0 and 23.');
  }

  // Create a date at the start of next hour
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);
  now.setUTCHours(now.getUTCHours() + 1);

  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const partsInTz = formatter.format(now).split(':');

  const hoursInTz = parseInt(partsInTz[0], 10);
  const utcHours = (hours + 24 - hoursInTz) % 24;

  parts[2] = utcHours.toString();

  return parts.join(' ');
}
