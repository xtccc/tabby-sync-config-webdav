import { Component, OnInit } from '@angular/core'
import { ConfigService, PlatformService } from 'terminus-core'
import { ToastrService } from 'ngx-toastr'
import { Connection, getGist, syncGist } from 'api';
import { PasswordStorageService } from 'services/PasswordStorage.service';
import * as yaml from 'js-yaml'
import { GistFile } from 'gist/Gist';

/** @hidden */
@Component({
    template: require('./SettingsTab.component.pug'),
    styles: [require('./SettingsTab.component.scss')]
})
export class SyncConfigSettingsTabComponent implements OnInit {
    private isUploading: boolean = false;
    private isDownloading: boolean = false;

    constructor(
        public config: ConfigService,
        private toastr: ToastrService,
        private platform: PlatformService,
        private passwordStorage: PasswordStorageService
    ) {
    }

    ngOnInit(): void {
    }

    private dateFormat(date: Date): any {
        var fmt = "yyyy-MM-dd HH:mm:ss";
        var o = {
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "H+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds(),
            "q+": Math.floor((date.getMonth() + 3) / 3),
            "S": date.getMilliseconds()
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }


    async sync(isUploading: boolean): Promise<void> {

        const { baseUrl, token, gist } = this.config.store.syncConfig;
        const selfConfig = JSON.parse(JSON.stringify(this.config.store.syncConfig));

        if (!token) {
            this.toastr.error("token is missing");
            return;
        }

        if (isUploading) this.isUploading = true;
        else {
            if (!gist) {
                this.toastr.error("gist id is missing");
                return;
            }
            this.isDownloading = true;
        }


        try {
            if (isUploading) {
                const files = [];

                const store = yaml.load(this.config.readRaw()) as any;

                // no sync self
                delete store.syncConfig;

                // config file
                files.push(new GistFile('config.yaml', yaml.dump(store)));

                // ssh password
                files.push(new GistFile('ssh.auth.json', JSON.stringify(await this.getSSHPluginAllPasswordInfos())));

                this.config.store.syncConfig.gist = await syncGist(token, baseUrl, gist, files);

            } else {

                const result = await getGist(token, baseUrl, gist);

                if (result.has('config.yaml')) {
                    const config = yaml.load(result.get('config.yaml').content) as any;
                    config.syncConfig = selfConfig;
                    this.config.writeRaw(yaml.dump(config));
                }
                // Maintain a check for `config.json` for backwards-compatibility.
                else if (result.has('config.json')) {
                    const config = yaml.load(result.get('config.json').content) as any;
                    config.syncConfig = selfConfig;
                    this.config.writeRaw(yaml.dump(config));
                }

                if (result.has('ssh.auth.json')) {
                    await this.saveSSHPluginAllPasswordInfos(JSON.parse(result.get('ssh.auth.json').content) as Connection[]);
                }

            }

            this.toastr.info('Sync succeeded', null, {
                timeOut: 1500
            });

            this.config.store.syncConfig.lastSyncTime = this.dateFormat(new Date);

        } catch (error) {
            console.error(error);
            this.toastr.error(error);
        } finally {
            if (isUploading) this.isUploading = false;
            else this.isDownloading = false;
            this.config.save();
        }

    }

    viewGist(): void {
        this.platform.openExternal(this.config.store.syncConfig.baseUrl + '/' + this.config.store.syncConfig.gist);
    }

    async saveSSHPluginAllPasswordInfos(conns: Connection[]) {
        if (conns.length < 1) return;
        for (const conn of conns) {
            try {
                await this.passwordStorage.savePassword(conn)
            } catch (error) {
                console.error(conn, error);
            }
        }

    }

    getSSHPluginAllPasswordInfos(): Promise<Connection[]> {
        return new Promise(async (resolve) => {

            const store = this.config.store

            let connections = [];
            if (store.version == "3" && store.profiles instanceof Array) {
                connections = store.profiles.filter(e => e.type === 'ssh' && typeof e.options === "object" && e.options.auth === "password").map(e => {
                    const { host, port, user } = e.options
                    return { host, port: port || 22, user: user || 'root' };
                })
            } else {
                connections = store.ssh.connections;
            }

            if (!(connections instanceof Array) || connections.length < 1) {
                resolve([]);
                return;
            }

            const infos = [];
            for (const connect of connections) {
                try {
                    const { host, port, user } = connect;
                    const pwd = await this.passwordStorage.loadPassword({ host, port, user });
                    if (!pwd) continue;
                    infos.push({
                        host, port, user,
                        auth: {
                            password: pwd,
                            encryptType: 'NONE'
                        }
                    });
                } catch (error) {
                    console.error(connect, error);
                }
            }

            resolve(infos);

        });


    }
}
