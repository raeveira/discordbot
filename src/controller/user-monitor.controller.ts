import {UserMonitorService} from "../service/user-monitor.service";
import {DiscordService} from '../service/discord.service';

export class UserMonitorController {
    private monitorService = new UserMonitorService();
    private checkInterval: NodeJS.Timeout | undefined;
    private lastDisplayTime = new Map<string, number>();
    private lastLocation = new Map<string, string>();
    private lastDiscordSent = 0;
    private discordService = new DiscordService(
        process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN',
        process.env.DISCORD_CHANNEL_ID || 'YOUR_CHANNEL_ID'
    );

    async startMonitoring() {
        console.log('Starting VRChat status monitoring...');
        await this.logToBoth('VRChat monitoring started.');

        // Initial check immediately
        await this.checkAndCompareStatuses(true);

        // Check every 1 minute
        this.checkInterval = setInterval(async () => {
            try {
                await this.checkAndCompareStatuses();
            } catch (err) {
                console.error('Status check failed:', err);
            }
        }, 120_000); // 2 minute

        process.on('SIGINT', () => this.stopMonitoring());
    }

    private async logToBoth(message: string) {
        console.log(message);
        await this.discordService.sendMessage(message);
    }

    private formatDiscordMessage(content: string): string {
        return `>>> ${content}`;
    }

    async checkAndCompareStatuses(forceDiscord = false) {
        const statuses = await this.monitorService.checkUserStatuses();
        const currentTime = Date.now();

        let discordContent = `=== Checking statuses at ${new Date().toLocaleTimeString()} ===\n\n`;
        let consoleContent = `\n=== Checking statuses at ${new Date().toLocaleTimeString()} ===\n`;
        let somethingChanged = false;

        for (const user of statuses) {
            const userId = user.id;
            const currentLocation = user.location;
            const prevLocation = this.lastLocation.get(userId);
            const hourElapsed = (currentTime - this.lastDiscordSent) > 3600000;

            // Build user entry
            const userEntry = `[${new Date().toLocaleTimeString()}] ${user.displayName}:\n` +
                `Status: ${currentLocation === "offline" ? "offline" : user.status}\n` +
                (currentLocation !== "offline"
                    ? `Location: ${user.worldName ? user.worldName : currentLocation}\n`
                    : "") +
                (prevLocation && currentLocation !== prevLocation ? "Note: Location changed!\n" : "") +
                "------------------------\n";

            consoleContent += userEntry;
            discordContent += userEntry;

            // Favorite user ping logic
            if (this.monitorService.favoriteUserIds.includes(userId)) {
                const wasOffline = prevLocation === "offline";
                const isOnline = currentLocation !== "offline";
                if (wasOffline && isOnline) {
                    const mention = "<@1211647296421371985>";
                    await this.discordService.sendMessage(
                        `${mention} ${user.displayName} came online!\nStatus: ${user.status}\nLocation: ${currentLocation}`
                    );
                }
            }

            // If any user changed location, mark as changed
            if (prevLocation === undefined || currentLocation !== prevLocation) {
                somethingChanged = true;
            }

            this.lastLocation.set(userId, currentLocation);
        }

        // Always log to console
        console.log(consoleContent);

        // Only send to Discord if something changed or an hour has passed or on first run
        if (forceDiscord || somethingChanged || (currentTime - this.lastDiscordSent) > 3600000) {
            await this.discordService.sendMessage(this.formatDiscordMessage(discordContent));
            this.lastDiscordSent = currentTime;
        }
    }

    async stopMonitoring() {
        clearInterval(this.checkInterval);
        await this.logToBoth('VRChat monitoring stopped.');
        process.exit(0);
    }
}
