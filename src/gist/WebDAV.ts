import { GistFile } from "./Gist";
import { execFile } from 'child_process';
import * as path from 'path';

/**
 * WebDAV backend that calls Go binary
 */
class WebDAV {
    private readonly token: string;
    private readonly baseUrl: string;
    private readonly binaryPath: string;

    constructor(token: string, baseUrl?: string) {
        this.token = token;
        this.baseUrl = baseUrl || '';
        // Go binary should be in the same directory as the plugin
        const isWindows = process.platform === 'win32';
        this.binaryPath = path.join(__dirname,isWindows ? 'sync-tool.exe' : 'sync-tool');
    }

    /**
     * Parse token to extract username and password
     * Expected format: "username:password"
     */
    private parseCredentials(): { username: string, password: string } {
        const parts = this.token.split(':');
        if (parts.length === 2) {
            return { username: parts[0], password: parts[1] };
        }
        return { username: this.token, password: '' };
    }

    /**
     * Get files from WebDAV directory
     */
    async get(directory: string): Promise<Map<string, GistFile>> {
        const { username, password } = this.parseCredentials();
        
        return new Promise((resolve, reject) => {
            const args = [
                'get',
                '--url', this.baseUrl,
                '--username', username,
                '--password', password,
                '--dir', directory || 'tabby-config'
            ];

            execFile(this.binaryPath, args, (error, stdout, stderr) => {
                if (error) {
                    reject(stderr || error.message);
                    return;
                }

                try {
                    const result = JSON.parse(stdout);
                    if (!result.success) {
                        reject('Failed to get files');
                        return;
                    }

                    const files = new Map<string, GistFile>();
                    for (const file of result.files || []) {
                        files.set(file.name, new GistFile(file.name, file.content));
                    }
                    resolve(files);
                } catch (e) {
                    reject('Invalid response from sync tool');
                }
            });
        });
    }

    /**
     * Sync files to WebDAV
     */
    async sync(directory: string, files: GistFile[]): Promise<string> {
        const { username, password } = this.parseCredentials();
        
        return new Promise((resolve, reject) => {
            const args = [
                'sync',
                '--url', this.baseUrl,
                '--username', username,
                '--password', password,
                '--dir', directory || ''
            ];

            const inputData = JSON.stringify(files);

            const child = execFile(this.binaryPath, args, (error, stdout, stderr) => {
                if (error) {
                    reject(stderr || error.message);
                    return;
                }

                try {
                    const result = JSON.parse(stdout);
                    if (!result.success) {
                        reject('Failed to sync files');
                        return;
                    }
                    resolve(result.directory);
                } catch (e) {
                    reject('Invalid response from sync tool');
                }
            });

            // Write files to stdin
            if (child.stdin) {
                child.stdin.write(inputData);
                child.stdin.end();
            }
        });
    }

    /**
     * Delete directory from WebDAV
     */
    async del(directory: string): Promise<boolean> {
        const { username, password } = this.parseCredentials();
        
        return new Promise((resolve, reject) => {
            const args = [
                'delete',
                '--url', this.baseUrl,
                '--username', username,
                '--password', password,
                '--dir', directory
            ];

            execFile(this.binaryPath, args, (error, stdout, stderr) => {
                if (error) {
                    reject(stderr || error.message);
                    return;
                }

                try {
                    const result = JSON.parse(stdout);
                    resolve(result.success);
                } catch (e) {
                    reject('Invalid response from sync tool');
                }
            });
        });
    }
}

export default WebDAV;
