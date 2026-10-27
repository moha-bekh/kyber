# Kyber Linux Installation Guide (Ubuntu)

This guide explains how to install and configure Kyber on Ubuntu for the available capture backends:

- **NVFBC + NVENC** (NVIDIA desktop capture under X11)
- **DRM / KMS** backend (non-NVIDIA GPUs with VAAPI)
- **XCB** (generic X11 fallback, CPU-side RGB capture, works with any encoder)
- **Wlroots** (wlroots screencopy/dmabuf capture for Wayland, works with any encoder)

See [Kyber Server Configuration](./KyberServerConfig.md#screen-capture-backend-linux) for the full backend reference.

## Requirements

The Linux packages (`kyber-ubuntu-noble-x86_64`, `kyber-debian-trixie-x86_64`)
need glibc 2.39 or newer: Ubuntu 24.04 or Debian 13 and later. Use the package
built for your distribution. Older releases, such as Ubuntu 22.04 or Debian 12,
cannot run them: build Kyber from source there.

## Install the runtime libraries

The package bundles FFmpeg, VLC and txproto, but not the system libraries
they link to. Install them whatever the backend:

```bash
sudo apt update
sudo apt install -y \
    libasound2t64 libdrm2 libegl1 libevdev2 libgbm1 libgl1 libidn12 \
    libinput10 libpulse0 libv4l-0t64 libva-drm2 libva2 libvdpau1 \
    libwayland-client0 libx11-6 libxcb1 libxcb-randr0 libxcb-shape0 \
    libxcb-shm0 libxcb-xfixes0
```

The client also loads the X11 cursor library at run time:

```bash
sudo apt install -y libxcursor1
```

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

### 1. Point kyavserver to its bundled libraries

A program with file capabilities ignores `LD_LIBRARY_PATH`, so once step 2 is
done `kyavserver` no longer finds the libraries next to it. Record their
directory in the binary itself, from the directory the package was extracted
to:

```bash
sudo apt install -y patchelf
patchelf --force-rpath --set-rpath "$PWD/lib:$PWD/lib/x86_64-linux-gnu" ./bin/kyavserver
```

Run it again if you move the directory. Do not add these directories to
`/etc/ld.so.conf.d`: every program on the system would then load Kyber's copies
of libraries such as libopus or libvulkan instead of the distribution's.

### 2. Grant required capabilities

After step 1: `patchelf` rewrites the file, which drops its capabilities.

```bash
sudo setcap cap_sys_admin+ep ./bin/kyavserver
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
