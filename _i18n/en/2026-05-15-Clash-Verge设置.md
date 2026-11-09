---
title: "Clash Verge Setup"
description: "Setup notes for Clash Verge Rev on Windows and macOS: installation, importing a subscription, system proxy and TUN mode, Merge overrides, terminal proxy variables, routing rules, and troubleshooting."
---
## Overview

> Based on Clash Verge Rev (Mihomo core), for Windows and macOS.
> Simplified architecture: **direct connection to airport nodes**, with no chained proxies and no fixed-IP relay.

## Related Dependencies

- Static IP: https://dashboard.1024proxy.com/getporxy/langStatic?pageType=apModel
- Airport IP: https://justmysocks3.net/members/clientarea.php
- Clash Verge installation: https://github.com/clash-verge-rev/clash-verge-rev/releases

## Architecture Overview

```plain
Local traffic
├── Domestic IPs / domains   →  direct
├── Private / LAN IPs        →  direct
└── Other foreign traffic    →  mihomo  →  airport nodes (automatic speed test)
```

---

## Part 1: Install Clash Verge Rev

### Windows

1. Open [GitHub Releases](https://github.com/clash-verge-rev/clash-verge-rev/releases) and download the installer for your architecture:
   - 64-bit Intel/AMD CPU: `Clash.Verge_x.y.z_x64-setup.exe`
   - ARM processor (such as Surface Pro X): `Clash.Verge_x.y.z_arm64-setup.exe`
2. Double-click to run the installer and finish the installation with the default wizard.
3. If a Windows SmartScreen warning appears, click **More info → Run anyway**.
4. On first launch, allow the firewall/network-related permissions.

### macOS

1. Download the DMG for your chip from [GitHub Releases](https://github.com/clash-verge-rev/clash-verge-rev/releases):
   - Apple Silicon (M series): `Clash.Verge_x.y.z_aarch64.dmg`
   - Intel Mac: `Clash.Verge_x.y.z_x64.dmg`
2. Open the DMG and drag `Clash Verge` into the `Applications` folder.
3. If a security restriction prompt appears on first launch, click **Open Anyway** under **System Settings → Privacy & Security**.
4. Grant the necessary local network / network extension permissions.

> If the DMG/EXE download stalls because of network problems, download it first with another proxy tool, or get it from a mirror site.

---

## Part 2: Configuration Flow (First Use)

### 1. Import a Subscription

1. Open Clash Verge Rev and go to the **Profiles** page in the left sidebar.
2. Click **New / Import** in the upper right corner.
3. Choose **Remote** as the type, enter the Clash/Clash Meta format subscription link provided by your airport, name it, and save.
4. After the download finishes, click **Use** on that subscription card to activate it.
5. If the subscription link is blocked and cannot be downloaded, check **Update via System Proxy** or **Update via Core Proxy** on the subscription item.

### 2. Choose a Node and Mode

1. Go to the **Proxies** page and click the lightning icon to run a latency test.
2. Choose **Rule** mode: foreign traffic goes through the proxy and domestic traffic goes direct. This is recommended for daily use.
3. In the `PROXY` group, choose `url-test` (automatic speed test) or specify a node manually.

### 3. Enable the System Proxy

Turn on the **System Proxy** switch in the upper right corner of the main window.
Browsers and most GUI applications will then use the proxy automatically.

### 4. (Optional) Enable TUN Mode

TUN mode takes over all outbound traffic, including UDP and CLI tools that do not support an HTTP proxy.

- **Windows**
  1. Go to **Settings → Service Mode**, click **Install**, confirm the UAC authorization, and wait for the indicator to turn green.
  2. Go to **Settings → TUN Mode** and turn on the switch. The system will create a virtual network adapter named `Meta`.
  3. Recommended settings: `stack: mixed`, `dns-hijack: any:53`, `auto-route: true`.
- **macOS**
  1. Go to **Settings → TUN Mode** and turn on the switch.
  2. The first time you turn it on, you will be asked to enter your login password to authorize installing the Helper.
  3. It is recommended to turn on **Enhanced Mode** at the same time.

> After enabling TUN mode, it is recommended to turn off the traditional system proxy to avoid processing traffic twice.

Once you reach this point, **the default scenario already works**: the airport subscription comes with its own `proxies` / `proxy-groups` / `rules`, so you do not need to write any configuration by hand.

If you want to customize further (custom DNS, TUN, a few special rules), see Part 3.

---

## Part 3: Advanced Customization: Overriding the Subscription Configuration

The YAML of an airport subscription is maintained by the airport, but you can override some of its fields with a Clash Verge **Merge** file, and **they will not be overwritten by subscription updates**.

### When You Need It

| Need | Override needed? |
|---|---|
| Only need to reach foreign sites, with domestic traffic direct | No |
| Want a more stable domestic DNS (Alibaba/Tencent) | Yes |
| Want to enable TUN mode and fine-tune its parameters | Yes |
| Want to force certain domains to use the proxy or go direct | Yes |
| Want to change `mixed-port` to avoid a port conflict | Yes |

### Steps to Create a Merge File

1. Go to **Profiles → the "…" menu in the upper right → Merge → New** and give it a name such as `local-override`.
2. Paste the snippet below into it and save.
3. Go back to the Profiles page, **right-click your airport subscription → Edit → Associate Merge**, and select the `local-override` you just created.
4. Re-activate the subscription for it to take effect.

### Recommended Merge Snippet (Sanitized)

```yaml
mixed-port: 7897
mode: rule
log-level: info
ipv6: true
unified-delay: true

profile:
  store-selected: true

tun:
  enable: false        # 需要 CLI/UDP 接管时改为 true
  stack: mixed         # UDP 走 system，TCP 走 gVisor
  auto-route: true
  auto-detect-interface: true
  strict-route: false
  dns-hijack:
    - any:53

dns:
  enable: true
  ipv6: true
  enhanced-mode: redir-host
  nameserver:
    - 223.5.5.5       # 阿里 DNS
    - 119.29.29.29    # 腾讯 DNS
  fallback:
    - 8.8.8.8         # Google DNS
    - 1.1.1.1         # Cloudflare DNS
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4

# 在订阅 rules 前插入的自定义规则
prepend-rules:
  # 示例：强制某域名直连
  # - DOMAIN-SUFFIX,example.com,DIRECT
  # 示例：强制某域名走代理（PROXY 组名以你机场订阅里的为准）
  # - DOMAIN-SUFFIX,example.org,PROXY
```

> This Merge file **contains no nodes and no passwords**; all nodes come from the airport subscription itself.
>
> `prepend-rules` / `append-rules` are Clash Verge override keywords that insert rules before / after the subscription's original rules respectively. If you are not familiar with YAML syntax, prefer `prepend-rules` (highest priority).

---

## Appendix: Fully Custom Configuration (Without an Airport Subscription)

You only need this section if you **do not import a subscription** and want to write a complete configuration from scratch. For everyday use, just follow Part 2.

> Do not write credentials (node passwords, UUIDs, `secret`) into this document. Keep them all in a local, uncommitted `secrets.local.yaml`.

```yaml
mode: rule
mixed-port: 7897
allow-lan: false
log-level: info
ipv6: true
external-controller: ''
secret: <YOUR_LOCAL_SECRET>
unified-delay: true

tun:
  enable: false
  stack: mixed
  auto-route: true
  auto-detect-interface: true
  strict-route: false
  dns-hijack:
    - any:53

profile:
  store-selected: true

dns:
  enable: true
  ipv6: true
  enhanced-mode: redir-host
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
  fallback:
    - 8.8.8.8
    - 1.1.1.1
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4

proxies:
  - name: ss-node-1
    type: ss
    server: <SERVER_IP_OR_DOMAIN>
    port: <PORT>
    cipher: <CIPHER>
    password: <PASSWORD>

  - name: ss-node-2
    type: ss
    server: <SERVER_IP_OR_DOMAIN>
    port: <PORT>
    cipher: <CIPHER>
    password: <PASSWORD>

  # VMess 节点示例
  # - name: vmess-node-1
  #   type: vmess
  #   server: <SERVER>
  #   port: <PORT>
  #   uuid: <UUID>
  #   alterId: 0
  #   cipher: auto

proxy-groups:
  - name: PROXY
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    proxies:
      - ss-node-1
      - ss-node-2

rules:
  - IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,127.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,100.64.0.0/10,DIRECT,no-resolve
  - IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
  - IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
  - IP-CIDR,169.254.0.0/16,DIRECT,no-resolve
  - IP-CIDR,224.0.0.0/4,DIRECT,no-resolve
  - GEOIP,CN,DIRECT
  - MATCH,PROXY
```

> **About `external-controller-unix`**: this setting is supported only on macOS / Linux. On Windows, delete or comment it out, otherwise the core will fail to start.

---

## Part 4: Terminal Environment Variables

When TUN mode is off, CLI tools do not go through mihomo automatically, so you need to set the proxy environment variables manually.

### macOS / Linux (`~/.zshrc` or `~/.bashrc`)

```bash
export HTTPS_PROXY=http://127.0.0.1:7897
export HTTP_PROXY=http://127.0.0.1:7897
export ALL_PROXY=socks5://127.0.0.1:7897
export NO_PROXY=localhost,127.0.0.1
```

To apply:

```bash
source ~/.zshrc
```

### Windows PowerShell (Current Session)

```powershell
$env:HTTPS_PROXY = "http://127.0.0.1:7897"
$env:HTTP_PROXY  = "http://127.0.0.1:7897"
$env:ALL_PROXY   = "socks5://127.0.0.1:7897"
$env:NO_PROXY    = "localhost,127.0.0.1"
```

### Windows Permanent (User Level)

Run this in a PowerShell administrator window:

```powershell
[Environment]::SetEnvironmentVariable("HTTPS_PROXY", "http://127.0.0.1:7897", "User")
[Environment]::SetEnvironmentVariable("HTTP_PROXY",  "http://127.0.0.1:7897", "User")
[Environment]::SetEnvironmentVariable("ALL_PROXY",   "socks5://127.0.0.1:7897", "User")
[Environment]::SetEnvironmentVariable("NO_PROXY",    "localhost,127.0.0.1", "User")
```

Or use the GUI: **This PC → Properties → Advanced system settings → Environment Variables → New user variable**.

### Windows CMD (Current Session)

```bat
set HTTPS_PROXY=http://127.0.0.1:7897
set HTTP_PROXY=http://127.0.0.1:7897
set ALL_PROXY=socks5://127.0.0.1:7897
set NO_PROXY=localhost,127.0.0.1
```

---

## Part 5: Routing Rules

| Traffic type | Matching rule | Destination |
| ------------ | ------------ | ------------------- |
| Private IP ranges | `IP-CIDR` | Direct |
| Mainland China IPs | `GEOIP,CN` | Direct |
| Other foreign traffic | `MATCH` | `PROXY` (automatic speed test) |

---

## Part 6: Troubleshooting

### 1. Verify the Proxy Is Working

```bash
# 确认代理环境变量已生效
echo $HTTPS_PROXY              # macOS/Linux
echo %HTTPS_PROXY%             # Windows CMD
$env:HTTPS_PROXY               # Windows PowerShell

# 测试代理链路
curl -v --proxy socks5://127.0.0.1:7897 https://www.google.com
```

### 2. Verify Which Rule a Domain Matched

Open the **Clash Verge → Connections** page to watch, in real time, the rule each request hit and the exit node it used.

### 3. TUN Mode Fails to Start on Windows

- Confirm that the core service has been installed and started through **Settings → Service Mode** (the indicator is green).
- Close other clients that occupy port 7897 or also use TUN (such as Clash for Windows).
- If necessary, re-run Clash Verge **as administrator**.

### 4. No Internet After Switching Networks

- Turn the **System Proxy** switch off and on again.
- Or restart the system proxy guard under **Settings → System Proxy → Proxy Guard**.
