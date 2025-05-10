import dotenv from 'dotenv';
dotenv.config();

import { AuthController } from './controller/auth.controller';
import { UserMonitorController } from './controller/user-monitor.controller';

const username = process.env.VRCHAT_USERNAME || '';
const password = process.env.VRCHAT_PASSWORD || '';

if (!username || !password) {
  console.error('❌ Please set VRCHAT_USERNAME and VRCHAT_PASSWORD environment variables.');
  process.exit(1);
}

async function main() {
  const authController = new AuthController();
  try {
    await authController.authenticate(username, password);
    // Start monitoring only after successful authentication
    const monitor = new UserMonitorController();
    monitor.startMonitoring();

    // Graceful shutdown
    process.on('SIGINT', () => {
      monitor.stopMonitoring();
      process.exit();
    });
  } catch (err) {
    console.error('❌ Authentication failed, exiting.');
    process.exit(1);
  }
}

main();
