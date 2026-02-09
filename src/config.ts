import { ConfigProvider } from 'terminus-core';

export class SyncConfigProvider extends ConfigProvider {
    defaults = {
        syncConfig: {
            baseUrl: '',
            token: '',
            gist: '',
            lastSyncTime: '-'
        }
    }
}