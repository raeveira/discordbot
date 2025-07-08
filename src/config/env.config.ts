export class EnvConfig {
    private static instance: EnvConfig;
    private env: { [key: string]: string };

    private constructor() {
        this.env = {};
        this.loadEnv();
    }

    public static getInstance(): EnvConfig {
        if (!EnvConfig.instance) {
            EnvConfig.instance = new EnvConfig();
        }
        return EnvConfig.instance;
    }

    private loadEnv(): void {
        const envFile = '.env';
        try {
            const data = require('fs').readFileSync(envFile, 'utf-8');
            data.split('\n').forEach((line: string) => {
                let [key, value] = line.split('=');
                if (key && value) {
                    // Check if value has "" or '' and remove them
                    value = value.trim().replace(/^['"]|['"]$/g, '');
                    this.env[key.trim()] = value.trim();
                }
            });
        } catch (error) {
            console.error(`Failed to load environment variables from ${envFile}:`, error);
        }
    }

    public get(key: string): string | undefined {
        return this.env[key];
    }
}