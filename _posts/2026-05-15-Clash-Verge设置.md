---
layout: post
title: Clash-Verge设置
date: 2026-05-15 20:00:00.000000000 +09:00
categories: [工具]
tags: [VPN]
---
## 说明

> 基于 Clash Verge Rev（Mihomo 内核），适用于 Windows 与 macOS。
> 简化架构：**机场节点直连**，不使用链式代理与固定 IP 中转。

## 相关依赖

- 机场订阅：从你使用的机场后台获取 Clash 格式订阅链接
- Clash Verge Rev 下载：https://github.com/clash-verge-rev/clash-verge-rev/releases

## 架构概览

```plain
本机流量
├── 国内 IP / 域名     →  直连
├── 私有 / 局域网 IP   →  直连
└── 其他国外流量       →  mihomo  →  机场节点（自动测速）
```

---

## 一、安装 Clash Verge Rev

### Windows

1. 打开 [GitHub Releases](https://github.com/clash-verge-rev/clash-verge-rev/releases)，下载对应架构的安装包：
   - 64 位 Intel/AMD CPU：`Clash.Verge_x.y.z_x64-setup.exe`
   - ARM 处理器（如 Surface Pro X）：`Clash.Verge_x.y.z_arm64-setup.exe`
2. 双击运行安装程序，按默认向导完成安装。
3. 若出现 Windows SmartScreen 警告，点击 **More info → Run anyway**。
4. 首次运行时允许防火墙/网络相关权限。

### macOS

1. 在 [GitHub Releases](https://github.com/clash-verge-rev/clash-verge-rev/releases) 下载对应芯片的 DMG：
   - Apple Silicon（M 系列）：`Clash.Verge_x.y.z_aarch64.dmg`
   - Intel Mac：`Clash.Verge_x.y.z_x64.dmg`
2. 打开 DMG，将 `Clash Verge` 拖入 `Applications` 文件夹。
3. 首次打开若提示安全限制，在 **系统设置 → 隐私与安全性** 中点击 **仍要打开**。
4. 授予必要的本地网络/网络扩展权限。

> 如果 DMG/EXE 因网络问题下载不动，可先用其它代理工具下载，或通过镜像站获取。

---

## 二、配置流程（首次使用）

### 1. 导入订阅

1. 打开 Clash Verge Rev，进入左侧 **订阅（Profiles）** 页面。
2. 点击右上角 **新建 / Import**。
3. 类型选 **Remote**，填入机场提供的 Clash/Clash Meta 格式订阅链接，命名后保存。
4. 下载完成后，点击该订阅卡片的 **使用 / Use** 激活。
5. 若订阅链接被墙下载不动，勾选订阅项的 **使用系统代理更新** 或 **使用内核代理更新**。

### 2. 选择节点与模式

1. 进入 **代理（Proxies）** 页面，点击闪电图标进行延迟测试。
2. 模式选择 **规则（Rule）**：国外走代理、国内直连，日常推荐。
3. 在 `PROXY` 组中选 `url-test`（自动测速）或手动指定节点。

### 3. 启用系统代理

在主界面右上角打开 **系统代理（System Proxy）** 开关即可。
浏览器、大多数 GUI 应用会自动走代理。

### 4. （可选）启用 TUN 模式

TUN 模式可接管所有出站流量，包含 UDP 与不支持 HTTP 代理的 CLI 工具。

- **Windows**
  1. 进入 **设置 → 服务模式**，点击 **安装**，确认 UAC 授权，等待指示灯变绿。
  2. 进入 **设置 → TUN 模式**，开启开关，系统将创建虚拟网卡 `Meta`。
  3. 推荐配置：`stack: mixed`、`dns-hijack: any:53`、`auto-route: true`。
- **macOS**
  1. 进入 **设置 → TUN 模式**，开启开关。
  2. 首次开启会要求输入登录密码授权安装 Helper。
  3. 推荐同时开启 **增强模式（Enhanced Mode）**。

> 开启 TUN 模式后，建议关闭传统系统代理，避免重复处理流量。

完成到这一步，**默认场景已经可以正常使用**——机场订阅自带 `proxies` / `proxy-groups` / `rules`，无需手写配置。

如果还想进一步定制（自定义 DNS、TUN、加几条特殊规则），看第三章。

---

## 三、进阶定制：覆写订阅配置

机场订阅的 YAML 由机场维护，但你可以通过 Clash Verge 的 **Merge** 文件覆盖其中部分字段，且**不会被订阅更新覆盖**。

### 何时需要

| 需求 | 是否需要覆写 |
|---|---|
| 只想科学上网，国内直连 | 否 |
| 想换更稳定的国内 DNS（阿里/腾讯） | 是 |
| 想开 TUN 模式并细调参数 | 是 |
| 想强制某些域名走代理/直连 | 是 |
| 想换 `mixed-port` 避免端口冲突 | 是 |

### Merge 文件创建步骤

1. 进入 **订阅 → 右上角"…" → Merge → New**，命名如 `local-override`。
2. 把下面的片段粘进去并保存。
3. 回到订阅页，**右键你的机场订阅 → 编辑 → 关联 Merge**，选中刚才那个 `local-override`。
4. 重新激活订阅生效。

### 推荐 Merge 片段（脱敏）

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

> 这份 Merge 文件**不含任何节点和密码**，所有节点都来自机场订阅本身。
>
> `prepend-rules` / `append-rules` 是 Clash Verge 的覆写关键字，分别在订阅原始规则之前/之后插入；不熟悉 yaml 语法时优先用 `prepend-rules`（优先级最高）。

---

## 附录：完全自定义配置（不使用机场订阅）

仅当你**不导入订阅**、要从零写完整配置时才需要本节。日常使用直接看第二章即可。

> 凭证（节点密码、UUID、`secret`）请勿写入此文档，统一放到本地未提交的 `secrets.local.yaml` 中。

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

> **关于 `external-controller-unix`**：该配置仅 macOS / Linux 支持，Windows 下请删除或注释，否则核心会启动失败。

---

## 四、终端环境变量配置

TUN 模式关闭时，CLI 工具不会自动走 mihomo，需要手动设置代理环境变量。

### macOS / Linux（`~/.zshrc` 或 `~/.bashrc`）

```bash
export HTTPS_PROXY=http://127.0.0.1:7897
export HTTP_PROXY=http://127.0.0.1:7897
export ALL_PROXY=socks5://127.0.0.1:7897
export NO_PROXY=localhost,127.0.0.1
```

生效：

```bash
source ~/.zshrc
```

### Windows PowerShell（当前会话）

```powershell
$env:HTTPS_PROXY = "http://127.0.0.1:7897"
$env:HTTP_PROXY  = "http://127.0.0.1:7897"
$env:ALL_PROXY   = "socks5://127.0.0.1:7897"
$env:NO_PROXY    = "localhost,127.0.0.1"
```

### Windows 永久生效（用户级）

PowerShell 管理员窗口执行：

```powershell
[Environment]::SetEnvironmentVariable("HTTPS_PROXY", "http://127.0.0.1:7897", "User")
[Environment]::SetEnvironmentVariable("HTTP_PROXY",  "http://127.0.0.1:7897", "User")
[Environment]::SetEnvironmentVariable("ALL_PROXY",   "socks5://127.0.0.1:7897", "User")
[Environment]::SetEnvironmentVariable("NO_PROXY",    "localhost,127.0.0.1", "User")
```

或通过 GUI：**此电脑 → 属性 → 高级系统设置 → 环境变量 → 新建用户变量**。

### Windows CMD（当前会话）

```bat
set HTTPS_PROXY=http://127.0.0.1:7897
set HTTP_PROXY=http://127.0.0.1:7897
set ALL_PROXY=socks5://127.0.0.1:7897
set NO_PROXY=localhost,127.0.0.1
```

---

## 五、分流规则说明

| 流量类型     | 匹配规则     | 走向                |
| ------------ | ------------ | ------------------- |
| 私有 IP 段   | `IP-CIDR`    | 直连                |
| 中国大陆 IP  | `GEOIP,CN`   | 直连                |
| 其他国外流量 | `MATCH`      | `PROXY`（自动测速） |

---

## 六、常见问题排查

### 1. 验证代理是否生效

```bash
# 确认代理环境变量已生效
echo $HTTPS_PROXY              # macOS/Linux
echo %HTTPS_PROXY%             # Windows CMD
$env:HTTPS_PROXY               # Windows PowerShell

# 测试代理链路
curl -v --proxy socks5://127.0.0.1:7897 https://www.google.com
```

### 2. 验证某个域名走了哪条规则

打开 **Clash Verge → 连接（Connections）** 页面，实时观察每条请求的命中规则与出口节点。

### 3. Windows TUN 模式启动失败

- 确认已通过 **设置 → 服务模式** 安装并启动核心服务（指示灯变绿）。
- 关闭其它占用 7897 端口或同样使用 TUN 的客户端（如 Clash for Windows）。
- 必要时以 **管理员身份** 重新运行 Clash Verge。

### 4. 切换网络后无法上网

- 关闭并重新打开 **系统代理** 开关。
- 或在 **设置 → 系统代理 → 代理守卫** 重启系统代理守护。
