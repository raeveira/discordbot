import axios from 'axios';
import { Client, GatewayIntentBits } from 'discord.js';

export class DiscordService {
  private botToken: string;
  private channelId: string;
  private client: Client;

  constructor(botToken: string, channelId: string) {
    this.botToken = botToken;
    this.channelId = channelId;
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
    });

    this.initializeClient();
  }

  private initializeClient() {
    this.client.once('ready', () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
    });

    this.client.login(this.botToken).catch(error => {
      console.error('Failed to connect to Discord Gateway:', error);
    });
  }

  async sendMessage(message: string): Promise<void> {
    try {
      // Existing axios-based message sending
      await axios.post(
        `https://discord.com/api/v10/channels/${this.channelId}/messages`,
        { content: message },
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      console.error('Failed to send Discord message:', error.response?.data || error.message);
    }
  }

  // Optional: Add methods to properly shutdown
  async destroy() {
    await this.client.destroy();
  }
}
