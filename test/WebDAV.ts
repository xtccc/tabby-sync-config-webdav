import { GistFile } from '../src/gist/Gist';
import WebDAV from '../src/gist/WebDAV';
import { webdavUrl, webdavToken } from './token';

/**
 * WebDAV test cases
 * 
 * To run these tests, you need:
 * 1. A WebDAV server (e.g., Nextcloud, ownCloud, or any WebDAV compatible server)
 * 2. Add webdavUrl and webdavToken to test/token.ts
 * 
 * webdavToken format: "username:password" (will be base64 encoded for Basic Auth)
 * webdavUrl format: "https://example.com/remote.php/dav/files/username"
 * 
 * Note: Tests are skipped by default unless credentials are provided
 */

const hasWebDAVConfig = webdavUrl && webdavToken;

const describeIf = hasWebDAVConfig ? describe : describe.skip;

describeIf('WebDAV', () => {

    test('get non-existent directory', async () => {
        const webdav = new WebDAV(webdavToken, webdavUrl);
        
        // Should return empty map for non-existent directory
        const files = await webdav.get('non-existent-directory-12345');
        expect(files.size).toBe(0);
    })

    test('sync and get files', async () => {
        const webdav = new WebDAV(webdavToken, webdavUrl);
        const testDir = `test-tabby-config-${Date.now()}`;
        
        try {
            // Sync files
            const dir = await webdav.sync(testDir, [
                new GistFile('config.yaml', 'test config content'),
                new GistFile('ssh.auth.json', '{"test": "auth"}')
            ]);
            
            expect(dir).toBe(testDir);
            
            // Get files back
            const files = await webdav.get(testDir);
            
            expect(files.has('config.yaml')).toBeTruthy();
            expect(files.get('config.yaml').value).toBe('test config content');
            expect(files.has('ssh.auth.json')).toBeTruthy();
            expect(files.get('ssh.auth.json').value).toBe('{"test": "auth"}');
            
        } finally {
            // Cleanup
            await webdav.del(testDir);
        }
    })

    test('sync without directory name auto-generates name', async () => {
        const webdav = new WebDAV(webdavToken, webdavUrl);
        let dirName: string;
        
        try {
            // Sync without providing directory name
            dirName = await webdav.sync(null, [
                new GistFile('test.txt', 'test content')
            ]);
            
            expect(dirName).toMatch(/^tabby-config-\d+$/);
            
            // Verify file exists
            const files = await webdav.get(dirName);
            expect(files.has('test.txt')).toBeTruthy();
            
        } finally {
            // Cleanup
            if (dirName) {
                await webdav.del(dirName);
            }
        }
    })

    test('delete directory', async () => {
        const webdav = new WebDAV(webdavToken, webdavUrl);
        const testDir = `test-delete-${Date.now()}`;
        
        // Create directory first
        await webdav.sync(testDir, [new GistFile('test.txt', 'content')]);
        
        // Delete it
        const result = await webdav.del(testDir);
        expect(result).toBeTruthy();
        
        // Verify it's gone
        const files = await webdav.get(testDir);
        expect(files.size).toBe(0);
    })

    test('update existing files', async () => {
        const webdav = new WebDAV(webdavToken, webdavUrl);
        const testDir = `test-update-${Date.now()}`;
        
        try {
            // Create initial files
            await webdav.sync(testDir, [
                new GistFile('config.yaml', 'version 1')
            ]);
            
            // Update files
            await webdav.sync(testDir, [
                new GistFile('config.yaml', 'version 2'),
                new GistFile('new.txt', 'new file')
            ]);
            
            // Verify updates
            const files = await webdav.get(testDir);
            expect(files.get('config.yaml').value).toBe('version 2');
            expect(files.get('new.txt').value).toBe('new file');
            
        } finally {
            await webdav.del(testDir);
        }
    })

})

describe('WebDAV Unit Tests (no server required)', () => {

    test('buildUrl constructs correct URLs', () => {
        const webdav = new WebDAV('user:pass', 'https://example.com/dav');
        
        // Access private method for testing using any
        const buildUrl = (webdav as any).buildUrl.bind(webdav);
        
        expect(buildUrl('test-dir')).toBe('https://example.com/dav/test-dir');
        expect(buildUrl('test-dir', 'file.txt')).toBe('https://example.com/dav/test-dir/file.txt');
        expect(buildUrl('/test-dir/')).toBe('https://example.com/dav/test-dir');
    })

    test('parsePropfind extracts filenames', () => {
        const webdav = new WebDAV('user:pass', 'https://example.com/dav');
        const parsePropfind = (webdav as any).parsePropfind.bind(webdav);
        
        const xmlResponse = `<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:">
    <d:response>
        <d:href>/dav/test/</d:href>
        <d:propstat>
            <d:prop>
                <d:displayname>test</d:displayname>
            </d:prop>
        </d:propstat>
    </d:response>
    <d:response>
        <d:href>/dav/test/file1.txt</d:href>
        <d:propstat>
            <d:prop>
                <d:displayname>file1.txt</d:displayname>
            </d:prop>
        </d:propstat>
    </d:response>
    <d:response>
        <d:href>/dav/test/file2.yaml</d:href>
        <d:propstat>
            <d:prop>
                <d:displayname>file2.yaml</d:displayname>
            </d:prop>
        </d:propstat>
    </d:response>
</d:multistatus>`;
        
        const files = parsePropfind(xmlResponse);
        expect(files).toContain('file1.txt');
        expect(files).toContain('file2.yaml');
        expect(files).not.toContain('test');  // Should exclude directory itself
    })

    test('isBase64 correctly identifies base64 strings', () => {
        const webdav = new WebDAV('user:pass', 'https://example.com/dav');
        const isBase64 = (webdav as any).isBase64.bind(webdav);
        
        expect(isBase64(btoa('username:password'))).toBeTruthy();
        expect(isBase64('not-base64!!!')).toBeFalsy();
        expect(isBase64('user:pass')).toBeFalsy();
    })

})
