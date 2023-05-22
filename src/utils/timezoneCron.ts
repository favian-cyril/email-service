import moment from 'moment-timezone';

export function convertCronToUTC(cron: string, timezone: string): string {
  const parts = cron.split(' ');

  if (parts.length !== 5) {
    throw new Error('Invalid cron string. Expected format is "* * * * *".');
  }

  const hours = parseInt(parts[2], 10);
  if (isNaN(hours) || hours < 0 || hours > 23) {
    throw new Error('Invalid hours value. Expected a number between 0 and 23.');
  }

  // Get current date and time in the target timezone
  const nowInTz = moment().tz(timezone);

  // Find out what the current time would be in UTC
  const nowInUtc = nowInTz.clone().tz('UTC');

  // Calculate the difference in hours between the target timezone and UTC
  const offset = nowInUtc.hour() - nowInTz.hour();

  // Adjust the hours in the cron string to UTC
  const utcHours = (hours + offset + 24) % 24;

  parts[2] = utcHours.toString();

  return parts.join(' ');
}
