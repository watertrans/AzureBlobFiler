export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileName(path: string): string {
  return path.replace(/^.*[\\/]/, '');
}

export function getFileExtension(path: string): string {
  return path.split('.').pop() as string;
}

// prettier-ignore
const iconSet = new Set<string>([
  'aac', 'ai', 'aiff', 'avi', 'bmp', 'c', 'cpp', 'css', 'csv', 'dat', 'dmg', 'doc', 'dotx',
  'dwg', 'dxf', 'eps', 'exe', 'flv', 'gif', 'h', 'hpp', 'html', 'ics', 'iso', 'java', 'jpg',
  'js', 'key', 'less', 'mid', 'mp3', 'mp4', 'mpg', 'odf', 'ods', 'odt', 'otp', 'ott', 'pdf',
  'php', 'png', 'ppt', 'psd', 'py', 'qt', 'rar', 'rb', 'rtf', 'sass', 'scss', 'sql', 'tga',
  'tgz', 'tiff', 'txt', 'wav', 'xls', 'xlsx', 'xml', 'yml','zip',
]);

export function getFileIcon(path: string): string {
  const prefix = '/img/icon/file/';
  const suffix = '.png';
  let ext = getFileExtension(path).toLowerCase();
  if (!iconSet.has(ext)) {
    ext = '_blank';
  }
  return prefix + ext + suffix;
}

export function convertToISO8601(date?: Date): string {
  if (date == null) {
    return '';
  }

  // prettier-ignore
  return date.getUTCFullYear() +
         '-' + padZero(date.getUTCMonth() + 1) +
         '-' + padZero(date.getUTCDate()) +
         'T' + padZero(date.getUTCHours()) +
         ':' + padZero(date.getUTCMinutes()) +
         ':' + padZero(date.getUTCSeconds()) +
         'Z';
}

export function convertToISO8601Local(date?: Date): string {
  if (date == null) {
    return '';
  }

  const timezoneOffset = new Date().getTimezoneOffset() * -1;

  if (timezoneOffset == 0) {
    return convertToISO8601(date);
  }

  const sig = timezoneOffset < 0 ? '-' : '+';
  const offsetHours = Math.floor(Math.abs(timezoneOffset / 60));
  const offsetMinutes = Math.abs(timezoneOffset % 60);

  // prettier-ignore
  return date.getFullYear() +
         '-' + padZero(date.getMonth() + 1) +
         '-' + padZero(date.getDate()) +
         'T' + padZero(date.getHours()) +
         ':' + padZero(date.getMinutes()) +
         ':' + padZero(date.getSeconds()) +
         sig + padZero(offsetHours) +
         ':' + padZero(offsetMinutes);
}

export function padZero(number: number, maxLength = 2): string {
  return number.toString().padStart(maxLength, '0');
}
