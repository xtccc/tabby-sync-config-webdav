import { Gist, GistFile } from "gist/Gist";
import WebDAV from "gist/WebDAV";

export function syncGist(token: string, baseUrl: string, gistId: string, files: Array<GistFile>): Promise<string> {

    return new Promise(async (resolve, reject) => {
        try {
            
            const webdav = new WebDAV(token, baseUrl);
            const result = await webdav.sync(gistId, files);
            resolve(result);

        } catch (error) {
            reject(error);
        }
    });
}

export function getGist(token: string, baseUrl: string, gistId: string): Promise<Map<string, GistFile>> {

    return new Promise(async (resolve, reject) => {
        try {
            
            const webdav = new WebDAV(token, baseUrl);
            const files = await webdav.get(gistId);
            resolve(files);

        } catch (error) {
            reject(error);
        }
    });
}

export class Connection {
    host: string;
    port?: number;
    user: string;
    auth?: {
        password: string,
        encryptType: 'NONE' | 'AES',
    };
}
