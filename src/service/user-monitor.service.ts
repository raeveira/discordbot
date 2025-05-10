import {vrchatAxios} from '../config/vrchat';
import {VRCUser} from '../model/user.model';
import fs from 'fs/promises';
import path from 'path';

export class UserMonitorService {
    private statusMap = new Map<string, VRCUser>();
    private worldNameCache = new Map<string, string>();
    private readonly configPath: string;
    public favoriteUserIds: string[] = [];

    constructor() {
        this.configPath = path.resolve(
            __dirname,
            process.env.NODE_ENV === 'development'
                ? '../../src/config/users.json'
                : '../../src/config/users.json'
        );
        this.loadConfig();
    }

    private async loadConfig() {
        try {
            const data = await fs.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(data);
            this.favoriteUserIds = config.favorites || [];
        } catch (error) {
            console.error('Error loading config:', error);
            this.favoriteUserIds = [];
        }
    }

    async loadUsers(): Promise<string[]> {
        try {
            const data = await fs.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(data);
            return (config.users || []).filter((id: string) => id.startsWith('usr_'));
        } catch (error) {
            console.error('Error loading user config:', error);
            return [];
        }
    }

    async getWorldName(worldId: string): Promise<string> {
        if (this.worldNameCache.has(worldId)) {
            return this.worldNameCache.get(worldId)!;
        }
        try {
            const response = await vrchatAxios.get(`/worlds/${worldId}`);
            const name = response.data.name || worldId;
            this.worldNameCache.set(worldId, name);
            return name;
        } catch (error) {
            this.worldNameCache.set(worldId, worldId); // fallback
            return worldId;
        }
    }


    async checkUserStatuses(): Promise<(VRCUser & { worldName?: string })[]> {
        const userIds = await this.loadUsers();
        const results: (VRCUser & { worldName?: string })[] = [];

        for (const userId of userIds) {
            let retries = 3;
            while (retries > 0) {
                try {
                    const response = await vrchatAxios.get(`/users/${userId}`);
                    const userData: VRCUser = {
                        id: response.data.id,
                        displayName: response.data.displayName,
                        status: response.data.status || 'offline',
                        location: response.data.location || 'offline',
                        last_login: response.data.last_login,
                        last_platform: response.data.last_platform
                    };

                    // If location is a world, fetch world name
                    let worldName: string | undefined;
                    const worldIdMatch = /^wrld_[a-f0-9-]+/i.exec(userData.location);
                    if (worldIdMatch) {
                        worldName = await this.getWorldName(worldIdMatch[0]);
                    }

                    this.statusMap.set(userId, userData);
                    results.push({ ...userData, worldName });
                    break;
                } catch (error: any) {
                    retries--;
                    if (retries === 0) {
                        const existingUser = this.statusMap.get(userId) || {
                            id: userId,
                            displayName: 'Unknown',
                            status: 'offline',
                            location: 'offline',
                            last_login: '',
                            last_platform: error.response?.data?.error?.message || 'API error'
                        };

                        this.statusMap.set(userId, existingUser);
                        results.push(existingUser);
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
        }
        return results;
    }
}
