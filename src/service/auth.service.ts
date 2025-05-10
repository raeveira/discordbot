import { AxiosResponse } from 'axios';
import { vrchatAxios } from '../config/vrchat';
import { VRCUser } from '../model/user.model';
import { saveCookiesToFile, loadCookiesFromFile } from './cookie.service';

export class AuthService {
  private currentUser: VRCUser | null = null;

  setAxiosCookies(cookies: string[]) {
    vrchatAxios.defaults.headers.Cookie = cookies.join('; ');
  }

  private updateCookies(response: AxiosResponse) {
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      saveCookiesToFile(cookies);
      this.setAxiosCookies(cookies);
    }
  }

  async isSessionValid(): Promise<boolean> {
    try {
      const response = await vrchatAxios.get('/auth/user');
      this.currentUser = response.data as VRCUser;
      return true;
    } catch {
      return false;
    }
  }

  async login(username: string, password: string): Promise<VRCUser> {
    const response = await vrchatAxios.get('/auth/user', {
      auth: { username, password }
    });
    this.updateCookies(response);
    this.currentUser = response.data as VRCUser;
    return this.currentUser;
  }

  async verify2FA(code: string, method: 'emailOtp' | 'totp'): Promise<void> {
    const endpoint = method === 'emailOtp'
      ? '/auth/twofactorauth/emailotp/verify'
      : '/auth/twofactorauth/totp/verify';

    const response = await vrchatAxios.post(endpoint, { code });
    this.updateCookies(response);
  }

  async getCurrentUser(): Promise<VRCUser | null> {
    if (!this.currentUser) {
      await this.isSessionValid(); // Refresh user data
    }
    return this.currentUser;
  }

  async tryLoadSession(): Promise<boolean> {
    const cookies = loadCookiesFromFile();
    if (cookies) {
      this.setAxiosCookies(cookies);
      return this.isSessionValid();
    }
    return false;
  }
}
