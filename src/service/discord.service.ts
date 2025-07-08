import axios from 'axios';
import {Client, GatewayIntentBits, EmbedBuilder, Interaction, GuildMember} from 'discord.js';

export class DiscordService {
    private readonly botToken: string;
    private client: Client;

    constructor(botToken: string) {
        this.botToken = botToken;
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
        });

        this.initializeClient();
    }

    private initializeClient() {
        this.client.once('ready', () => {
            console.log(`Discord bot logged in as ${this.client.user?.tag}`);
        });

        this.client.on('interactionCreate', async (interaction: Interaction) => {
                try {
                    if (!interaction.isChatInputCommand()) return;
                    const allowedRoleId = '1219022939777794153';
                    const member = interaction.member;
                    if (!member) {
                        await interaction.reply({content: 'This command can only be used in a server.', ephemeral: true});
                        return;
                    }

                    // For GuildMemberRoleManager
                    if ('roles' in member && 'cache' in member.roles) {
                        if (!(member.roles.cache.has(allowedRoleId))) {
                            await interaction.reply({
                                content: 'You do not have permission to use this command.',
                                ephemeral: true
                            });
                            return;
                        }
                    }
                    // For string[] fallback
                    else if ('roles' in member && Array.isArray(member.roles)) {
                        if (!(member.roles.includes(allowedRoleId))) {
                            await interaction.reply({
                                content: 'You do not have permission to use this command.',
                                ephemeral: true
                            });
                            return;
                        }
                    }

                    if (interaction.commandName === 'embed') {
                        const titleInput = interaction.options.getString('title', true);
                        const formattedTitle = titleInput.replace(/\\n/g, '\n');

                        const descriptionInput = interaction.options.getString('description', true);
                        const formattedDescription = descriptionInput.replace(/\\n/g, '\n');

                        const colorInput = interaction.options.getString('color') || '0099ff';
                        const sanitizedColor = colorInput.replace(/^#/, '').padEnd(6, '0');

                        const embed = new EmbedBuilder()
                            .setTitle(formattedTitle)
                            .setDescription(formattedDescription)
                            .setColor(`#${sanitizedColor}`);

                        await interaction.reply({embeds: [embed]});
                    }
                } catch
                    (err) {
                    console.error('Error handling interaction:', err);
                    if (interaction.isRepliable()) {
                        await interaction.reply({content: 'There was an error processing your command.', ephemeral: true});
                    }
                }
            }
        );

        this
            .client
            .login(this

                .botToken
            ).catch(error => {
                console
                    .error(
                        'Failed to connect to Discord Gateway:'
                        ,
                        error
                    );
            }
        )
        ;
    }

    async sendMessage(message: string, channelId: string): Promise<void> {
        try {
            // Existing axios-based message sending
            await axios.post(
                `https://discord.com/api/v10/channels/${channelId}/messages`,
                {content: message},
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
