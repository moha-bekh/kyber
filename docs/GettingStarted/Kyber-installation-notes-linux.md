# Kyber Linux Installation Guide (Ubuntu)

This guide explains how to install and configure Kyber on Ubuntu for the available capture backends:

- **NVFBC + NVENC** (NVIDIA desktop capture under X11)
- **DRM / KMS** backend (non-NVIDIA GPUs with VAAPI)
- **XCB** (generic X11 fallback, CPU-side RGB capture, works with any encoder)
- **Wlroots** (wlroots screencopy/dmabuf capture for Wayland, works with any encoder)

See [Kyber Server Configuration](./KyberServerConfig.md#screen-capture-backend-linux) for the full backend reference.

## Option 1 - NVFBC + NVENC Backend

### 1. Make sure you are using an X11 session

```bash
echo $XDG_SESSION_TYPE
```

Expected output:

```text
x11
```

### 2. Update the system

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. Install required dependencies

```bash
sudo apt install -y libva-x11-2 libva-drm2
```

### 4. Install the NVIDIA proprietary driver

```bash
sudo apt install -y nvidia-driver-XXX
```

For Linux, **570.86.16 or newer** is required.

### 5. Reboot the machine

```bash
sudo reboot
```

### 6. Verify NVFBC libraries are installed

```bash
ldconfig -p | grep nvidia-fbc
```

Should give you:

```
libnvidia-fbc.so.1 (libc6,x86-64) => /lib/x86_64-linux-gnu/libnvidia-fbc.so.1
libnvidia-fbc.so (libc6,x86-64) => /lib/x86_64-linux-gnu/libnvidia-fbc.so
```

### 7. Configure Kyber

In the kyber_config.toml:

```toml
encoder = "nvenc"
grab_backend = "nvfbc"
```

## Option 2 - DRM / KMS Backend

### 1. Grant required capabilities

```bash
sudo setcap cap_sys_admin+ep ./bin/kyavserver
```

### 2. Add custom runtime libraries

```bash
sudo vim /etc/ld.so.conf.d/txproto.conf
```

Add:

```text
$PATH_TO_KYBER_DESKTOP/lib
$PATH_TO_KYBER_DESKTOP/lib/x86_64-linux-gnu
```

```bash
sudo ldconfig
```

### 3. Install dependencies

```bash
sudo apt update
sudo apt install -y mesa-va-drivers libva2 libva-drm2 libva-x11-2 libvdpau1
```

### 4. Configure Kyber

In the kyber_config.toml:

```toml
encoder = "vaapi"
grab_backend = "drm"
```
