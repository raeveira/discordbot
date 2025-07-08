import {REST, Routes, SlashCommandBuilder} from 'discord.js';

export class SlashCommandRegistrar {
    private readonly botToken: string;
    private readonly clientId: string;
    private readonly guildId: string;

    constructor(botToken: string, clientId: string, guildId: string) {
        this.botToken = botToken;
        this.clientId = clientId;
        this.guildId = guildId;
    }

    /**
     * Registers the slash commands with Discord.
     * This method uses the Discord REST API to register commands.
     * It should be called once, typically during application startup.
     */
    public async registerCommands(): Promise<void> {
        const commands = [
            new SlashCommandBuilder()
                .setName('embed')
                .setDescription('Create a custom embed')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Embed title')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Embed description')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Hex color (e.g. 0099ff)')
                        .setRequired(false))
                .toJSON(),
        ];

        const rest = new REST({version: '10'}).setToken(this.botToken);

        try {
        // --- Remove all existing commands first ---
        const existing = await rest.get(
            Routes.applicationGuildCommands(this.clientId, this.guildId)
        ) as any[];

        if (existing.length > 0) {
            const deletePromises = existing.map(cmd =>
                rest.delete(
                    Routes.applicationGuildCommand(this.clientId, this.guildId, cmd.id)
                )
            );
            await Promise.all(deletePromises);
            console.log(`Deleted ${existing.length} existing guild commands.`);
        } else {
            console.log('No existing guild commands to delete.');
        }
        } catch (error) {
            console.error('Error deleting existing commands:', error);
        }

        try {
            await rest.put(
                Routes.applicationGuildCommands(this.clientId, this.guildId),
                {body: commands},
            );
            console.log('Slash commands registered successfully.');
        } catch (error) {
            console.error('Error registering slash commands:', error);
        }
    }
}
