---
title: Kyber Server Configuration
---
# Kyber Server Configuration

The Kyber server is configured exclusively through the single configuration file: `kyber_config.toml`.

**Warning: most of the configuration file changes require the server to be restarted to take them into account.**

## Quick Reference

| Section | Purpose |
|---------|---------|
| [Video & Audio](#video--audio-avserver) | Encoding and screen capture |
| [Controller](#controller-controller) | Network, TLS, and authentication |
| [Input](#input-inputserver) | Keyboard, mouse, clipboard, gamepad |
| [Virtual Display](#virtual-display-windows_servicekidd) | Virtual monitors (Windows only, driver not yet public) |


## Video & Audio `[avserver]`

Video encoding and screen capture settings.

### Encoder Selection

| Value | Hardware | Platform | Description | Experimental |
|-------|----------|----------|-------------|--------------|
| `nvenc` | NVIDIA GPU | Windows, Linux | NVIDIA hardware encoder (recommended) | No |
| `x264` | CPU (any) | Windows, Linux | Software encoder, higher CPU usage | No |
| `amf` | AMD GPU | Windows | AMD hardware encoder | Yes |
| `qsv` | Intel CPU w/ integrated graphics | Windows | Intel Quick Sync Video | Yes |
| `vaapi` | Intel or AMD GPU | Linux | Linux hardware acceleration | Yes |

### Screen Capture Backend (Linux)

The `grab_backend` option selects the screen capture backend on Linux. It has no effect on Windows.

| Value | Display Server | Compatible Encoders | Description |
|-------|----------------|---------------------|-------------|
| `nvfbc` | X11 | `nvenc` | NVIDIA Frame Buffer Capture. Requires an NVIDIA GPU under X11 |
| `drm` | DRM/KMS | `vaapi` | DRM/KMS capture for non-NVIDIA GPUs |
| `xcb` | X11 | Any | Generic X11 fallback (CPU-side RGB capture) |
| `wlroots` | Wayland (wlroots) | Any | wlroots screencopy / dmabuf capture |

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `encoder` | `"nvenc"` | Video encoder to use (see table above) |
| `grab_backend` | `"nvfbc"` | Screen capture backend (Linux only — see table above) |
| `intra_refresh` | `true` | Enable Intra Refresh. Only with Kymux + nvenc |
| `clock_type` | `"ZeroedOrigin"` | PTS clock for audio/video. Values: `"ZeroedOrigin"`, `"System"` |
| `minimum_bitrate` | `5000000` | Minimum bitrate in bps (default: 5 Mbps) |

### Watermark

Optional overlay on encoded video. Supports PNG format.

| Option | Default | Description |
|--------|---------|-------------|
| `watermark.file` | none | Path to PNG image |
| `watermark.x` | `0.0` | Horizontal position: `-1.0` (left) to `1.0` (right) |
| `watermark.y` | `0.0` | Vertical position: `-1.0` (bottom) to `1.0` (top) |

### Example

```toml
[avserver]
encoder = "nvenc"
minimum_bitrate = 8000000

[avserver.watermark]
file = "./logo.png"
x = 1.0
y = 1.0
```


## Controller `[controller]`

Network and authentication settings.

### Network

| Option | Default | Description |
|--------|---------|-------------|
| `port` | `8080` | HTTP (TCP) and QUIC (UDP) listening port |
| `dataplane_port` | — | Override QUIC port. **Warning:** May break NAT setups |
| `tls_cert` | `"kybertest_cert.pem"` | TLS certificate path |
| `tls_key` | `"kybertest_key.pem"` | TLS private key path |
| `webtransport_gen_certificate` | `true` | Auto-generate certificate for WebTransport |

### Session

| Option | Default | Description |
|--------|---------|-------------|
| `session.disable_same_site_protection` | `false` | Set `SameSite=none`. **Dev only — disables CSRF protection** |

### JWT Authentication

| Option | Default | Description |
|--------|---------|-------------|
| `auth.jwt.algorithm` | `"HS256"` | Signature algorithm: `"HS256"` or `"RS256"` |
| `auth.jwt.key` | `{ plain = "kyber-authentication-development-key" }` | Signing key (see example) |

### Example

```toml
[controller]
port = 443
tls_cert = "/etc/kyber/server.pem"
tls_key = "/etc/kyber/server.key"

[controller.session]
disable_same_site_protection = false

[controller.auth.jwt]
algorithm = "RS256"
key = { file = "/etc/kyber/jwt-public.pem" }
```


## Input `[inputserver]`

Input device handling.

| Option | Default | Platform | Description |
|--------|---------|----------|-------------|
| `gamepad_force_xbox360` | `false` | Windows | Force Xbox 360 controller emulation |
| `clipboard_allow_copy` | `true` | All | Allow reading host clipboard |
| `clipboard_allow_paste` | `true` | All | Allow writing to host clipboard |
| `keyboard_key_repeat` | `true` | Windows | Enable key repeat on host |

### Example

```toml
[inputserver]
clipboard_allow_copy = true
clipboard_allow_paste = false
```


## Virtual Display `[windows_service.kidd]`

Virtual display driver. **Windows only.**

> **Note:** Requires the Kidd driver that will be published soon.

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Enable/disable Kidd driver |
| `monitor_count` | `1` | Number of virtual monitors |
| `plug_strategy` | `"minimal_monitor_count"` | When to plug monitors (see below) |

### Plug Strategies

| Value | Behavior |
|-------|----------|
| `when_no_monitor` | Only if no physical monitor detected |
| `always` | Always plug configured number |
| `minimal_monitor_count` | Plug only enough to reach `monitor_count` |

### Custom Display Modes

Add custom resolutions using `[windows_service.kidd.extra_modes](../windows_service.kidd.extra_modes.md)` (repeatable):

```toml
[windows_service.kidd]
enabled = true
plug_strategy = "minimal_monitor_count"
monitor_count = 2

[windows_service.kidd.extra_modes](../windows_service.kidd.extra_modes.md)
width = 1920
height = 800
vsync = 60

[windows_service.kidd.extra_modes](../windows_service.kidd.extra_modes.md)
width = 2560
height = 1080
vsync = 144
```
