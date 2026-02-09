# Sync Config

### For the [Tabby](https://github.com/Eugeny/tabby) terminal

This plugin can sync configuration files to WebDAV servers.

![](./screenshot.png)

---
## build

```
./build.sh
```

## Supported Backends

### WebDAV
Sync your Tabby configuration to any WebDAV-compatible server (Nextcloud, ownCloud, NAS, etc.).

**Setup:**
1. Enter your WebDAV server URL:
   - Nextcloud: `https://cloud.example.com/remote.php/dav/files/username`
   - ownCloud: `https://cloud.example.com/remote.php/webdav`
   - Generic: `https://webdav.example.com/dav`
2. Enter credentials in the format `username:password`
   - The credentials will be base64 encoded for Basic Auth
   - You can also use pre-encoded base64 credentials
3. Enter a directory name (optional, defaults to auto-generated)
4. Sync

**Supported WebDAV Servers:**
- [Nextcloud](https://nextcloud.com)
- [ownCloud](https://owncloud.com)
- [Seafile](https://www.seafile.com)
- [Synology NAS](https://www.synology.com)
- [QNAP NAS](https://www.qnap.com)
- Any standard WebDAV server

---

## Features

- **Self-Hosted Support**: GitLab and WebDAV work with your own servers
- **Easy Setup**: Simple configuration through Tabby settings UI
- **Automatic Sync**: One-click upload and download

---