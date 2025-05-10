import fs from 'fs';

const COOKIE_FILE = 'cookies.json';

export function saveCookiesToFile(cookies: string[]) {
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies));
}

export function loadCookiesFromFile(): string[] | null {
  if (fs.existsSync(COOKIE_FILE)) {
    return JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));
  }
  return null;
}
