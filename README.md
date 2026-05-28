# OpenClaw Ubuntu Setup Scripts

Upload these scripts to your new Ubuntu OpenClaw machine and run them in order.
Avoids all the heredoc/paste issues in terminal.

## How to use

Upload this zip to the new machine, then:

```bash
unzip openclaw-setup-scripts.zip -d ~/setup
cd ~/setup
```

## Scripts

### 1. setup-cloudflared-config.js
Creates the cloudflared tunnel config file.
```bash
node setup-cloudflared-config.js <TUNNEL_ID> <machine-name>
# Example:
node setup-cloudflared-config.js d98e7381-ef76-4ff2-acc3-85968581316b skywork2
```

### 2. setup-cloudflared-service.js
Installs cloudflared as a system service. Run with sudo.
```bash
sudo node setup-cloudflared-service.js <TUNNEL_ID>
# Example:
sudo node setup-cloudflared-service.js d98e7381-ef76-4ff2-acc3-85968581316b
```

### 3. setup-cli-terminal.js
Creates and starts the browser CLI terminal on port 4000.
```bash
node setup-cli-terminal.js <machine-name>
# Example:
node setup-cli-terminal.js skywork2
```
Then run `pm2 startup` and execute the command it outputs.

### 4. setup-openclaw-gateway.js
Configures OpenClaw gateway for Cloudflare tunnel access.
```bash
node setup-openclaw-gateway.js <machine-name>
# Example:
node setup-openclaw-gateway.js skywork2
```

### 5. fix-skill-paths.js
After uploading skills from another machine, fixes all hardcoded paths.
```bash
node fix-skill-paths.js
```

## Full Order of Operations

1. Install OpenClaw (`curl -fsSL https://openclaw.ai/install.sh | bash`)
2. Run `openclaw onboard --install-daemon`
3. Run `cloudflared tunnel login` and authorize in browser
4. Run `cloudflared tunnel create <machine-name>` — note the tunnel ID
5. Run `cloudflared tunnel route dns <machine-name> <machine-name>.batmanbluestone.com`
6. Run `cloudflared tunnel route dns <machine-name> <machine-name>-cli.batmanbluestone.com`
7. Run `node setup-cloudflared-config.js <tunnel-id> <machine-name>`
8. Run `sudo node setup-cloudflared-service.js <tunnel-id>`
9. Run `node setup-cli-terminal.js <machine-name>` then `pm2 startup`
10. Run `node setup-openclaw-gateway.js <machine-name>`
11. Tell Axel: "Set up Cloudflare Access for <machine-name> and <machine-name>-cli"
12. Upload skills zip → extract to ~/.openclaw/skills/
13. Run `node fix-skill-paths.js`

## Credentials
- CLI Terminal password: `AxelCLI2026!`
- Cloudflare Access emails: kevin@knoxweb.com, alexander@bluestoneapps.com
