import fs from 'fs'
import path from 'path'

const tokenDir = 'token';

// Helper to safely read token files
function readTokenFile(filename: string): string {
    try {
        return fs.readFileSync(path.join(tokenDir, filename), { encoding: 'utf-8' }).trim();
    } catch (e) {
        return '';
    }
}

const giteeToken = readTokenFile('gitee.token');
const githubToken = readTokenFile('github.token');
const gitlabToken = readTokenFile('gitlab.token');

// WebDAV configuration
// Token format: "username:password" (can be base64 encoded or plain)
// Example: "admin:secret123" or base64 encoded "YWRtaW46c2VjcmV0MTIz"
const webdavToken = readTokenFile('webdav.token');

// WebDAV server URL
// Examples:
// - Nextcloud: https://cloud.example.com/remote.php/dav/files/username
// - ownCloud: https://cloud.example.com/remote.php/webdav
// - Generic: https://webdav.example.com
const webdavUrl = readTokenFile('webdav.url');

export {
    giteeToken,
    githubToken,
    gitlabToken,
    webdavToken,
    webdavUrl,
};