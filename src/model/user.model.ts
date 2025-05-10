export interface VRCUser {
  id: string;
  displayName: string;
  status: 'active' | 'join me' | 'ask me' | 'busy' | 'offline';
  location: string;
  last_login: string;
  last_platform: string;
  requiresTwoFactorAuth?: string[];
}
