---
title: Kyber Server Configuration
---
# Kyber Server Configuration

The Kyber server is configured exclusively through the single configuration file: `kyber_config.toml`.

**Warning: most of the configuration file changes require the server to be restarted to take them into account.**

Section names must match exactly. A section with another name (for example the
`[avserver]` or `[controller]` names used by older versions) is ignored without
an error, and the server then uses its defaults. Set `KYBER_CONFIG` to use a
configuration file other than the one next to the executables.

## Quick Reference

| Section | Purpose |
|---------|---------|
| [Video & Audio](#video--audio-kyavserver) | Encoding and screen capture |
| [Controller](#controller-kycontroller) | Network, TLS, and authentication |
| [Input](#input-kynputserver) | Keyboard, mouse, clipboard, gamepad |
| [Virtual Display](#virtual-display-kyservicekidd) | Virtual monitors (Windows only, driver not yet public) |


## Video & Audio `[kyavserver]`

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
| `backend` | `"txproto"` | AV engine for capture, encode and mux: `"txproto"` (legacy, kept as a fallback) or `"libavconv"` (new) |
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
[kyavserver]
encoder = "nvenc"
minimum_bitrate = 8000000

[kyavserver.watermark]
file = "./logo.png"
x = 1.0
y = 1.0
```


## Controller `[kycontroller]`

Network and authentication settings.

### Network

| Option | Default | Description |
|--------|---------|-------------|
| `port` | `8080` | HTTP (TCP) and QUIC (UDP) listening port |
| `dataplane_port` | — | Override QUIC port. **Warning:** May break NAT setups |
| `tls_cert` | `"kybertest_cert.pem"` | TLS certificate path |
| `tls_key` | `"kybertest_key.pem"` | TLS private key path |
| `webtransport_gen_certificate` | `true` | Auto-generate certificate for WebTransport |

### Security `[kycontroller.security]`

Browser CSRF protection. The defaults are strict; change them only after
unexpected unauthorized access errors from a browser client.

| Option | Default | Description |
|--------|---------|-------------|
| `same_site` | `true` | Apply `SameSite: Strict` to the session cookie. Set to `false` only for cross-site scenarios |
| `trusted_origins` | `[]` | Origins allowed to send cross-origin requests: a list of origin strings, or `"*"` |

### JWT Authentication `[kycontroller.auth.jwt]`

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Enable/disable the JWT backend |
| `algorithm` | `"HS256"` | Signature algorithm: `"HS256"` or `"RS256"` |
| `key` | `{ plain = "kyber-authentication-development-key" }` | Verification key (see example) |

### Example

```toml
[kycontroller]
port = 443
tls_cert = "/etc/kyber/server.pem"
tls_key = "/etc/kyber/server.key"

[kycontroller.security]
same_site = true

[kycontroller.auth.jwt]
algorithm = "RS256"
key = { file = "/etc/kyber/jwt-public.pem" }
```


## Input `[kynputserver]`

Input device handling.

| Option | Default | Platform | Description |
|--------|---------|----------|-------------|
| `gamepad_force_xbox360` | `false` | Windows | Force Xbox 360 controller emulation |
| `clipboard_allow_copy` | `true` | All | Allow reading host clipboard |
| `clipboard_allow_paste` | `true` | All | Allow writing to host clipboard |
| `keyboard_key_repeat` | `true` | Windows | Enable key repeat on host |

### Example

```toml
[kynputserver]
clipboard_allow_copy = true
clipboard_allow_paste = false
```


## Virtual Display `[kyservice.kidd]`

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

Add custom resolutions with `[[kyservice.kidd.extra_modes]]` (repeatable):

```toml
[kyservice.kidd]
enabled = true
plug_strategy = "minimal_monitor_count"
monitor_count = 2

[[kyservice.kidd.extra_modes]]
width = 1920
height = 800
vsync = 60

[[kyservice.kidd.extra_modes]]
width = 2560
height = 1080
vsync = 144
```
