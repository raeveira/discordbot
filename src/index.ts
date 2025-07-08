import {DiscordService} from "./service/discord.service";
import {EnvConfig} from "./config/env.config";
import {SlashCommandRegistrar} from "./service/SlashCommandRegistrar";

async function main() {

    try {
        // Define classes
        const envConfig = EnvConfig.getInstance();

        const registrar = new SlashCommandRegistrar(envConfig.get('DISCORD_BOT_TOKEN') || '', envConfig.get('DISCORD_CLIENT_ID') || '', envConfig.get('DISCORD_GUILD_ID') || '');
        await registrar.registerCommands();

        const discordService = new DiscordService(
            envConfig.get('DISCORD_BOT_TOKEN') || ''
        );

        await discordService.sendMessage("Hello, Discord!", "1370842391841607763");

        // Graceful shutdown
        process.on('SIGINT', () => {
            discordService.destroy()
            process.exit();
        });
    } catch (err) {
        console.error('❌ Startup failed, exiting.');
        process.exit(1);
    }
}

main();
