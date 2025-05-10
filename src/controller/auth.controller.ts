import { createInterface } from 'readline/promises';
import { stdin, stdout } from 'process';
import { AuthService } from '../service/auth.service';
import { VRCUser } from '../model/user.model';

export class AuthController {
  private authService = new AuthService();

  async authenticate(username: string, password: string) {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      const hasValidSession = await this.authService.tryLoadSession();
      let user: VRCUser | null = null;

      if (hasValidSession) {
        user = await this.authService.getCurrentUser();
        if (user?.displayName) {
          console.log(`✅ Session valid! Logged in as: ${user.displayName}`);
          return;
        }
        console.log('🔄 Session expired or incomplete, re-authenticating...');
      }

      // Full authentication flow
      user = await this.authService.login(username, password);

      // Handle 2FA with proper type checking
      if (user.requiresTwoFactorAuth?.length) {
        const methods = user.requiresTwoFactorAuth.filter(m =>
          m === 'emailOtp' || m === 'totp'
        ) as ('emailOtp' | 'totp')[];

        for (const method of methods) {
          const code = await rl.question(`Enter ${method} code: `);
          await this.authService.verify2FA(code, method);
          user = await this.authService.login(username, password); // Refresh session
          if (!user.requiresTwoFactorAuth) break;
        }
      }

      if (user?.displayName) {
        console.log(`✅ Successfully logged in as ${user.displayName}`);
      } else {
        throw new Error('Authentication succeeded but user data is incomplete');
      }
    } catch (err: any) {
      if (err.response) {
        console.error('❌ Authentication failed:',
          err.response.data?.error?.message || err.response.data);
      } else {
        console.error('❌ Error:', err.message);
      }
    } finally {
      rl.close();
    }
  }
}
