# Build System Documentation

This document provides an overview of the build system for the `desktop-client` repository, including its usage, limitations, and pitfalls. For a concise version, refer to the TL;DR document.

## About the `desktop-client` Repository

- **Windows Build**: Only supported as a cross-build from Linux to Windows using MinGW.
- **macOS Build**: Supports cross-building from Intel to Apple Silicon and vice versa.
- **Dependencies**: The `README.md` lists all required packages for installation.
- **Incremental Builds**: :warning: :warning: Not supported. Avoid running the default build command multiple times. :warning: :warning: 
- **Subcomponent Builds**: After the initial build, individual subcomponents can be rebuilt, sometimes requiring specific workarounds (e.g., rebuilding a specific `avserver` contrib).

## Global Approach

1. Follow the `README.md` instructions to set up the build environment and complete the initial build.
2. After the first successful build, focus on building only the components you are working on.

## Build Scripts

The `build-<platform>.sh` scripts provide the following options:

- `-o <path>`: Specifies the output directory for the build.
- `-s`: Skips rebuilding `contrib` dependencies.

For root repositories (`desktop-client`, `web-client`, `android-client`, `ios-client`), additional options are available:

- `-n`: Prevents workspace updates.
- `-p` (Windows and macOS only): Packages the application.

All build scripts can be run independently to rebuild specific subcomponents, targeting the default output directory.

## `contrib` Build Structure

The `contrib` build scripts generate a directory structure under a `work` folder, containing:

- `src`: Source archives for dependencies (e.g., `ffmpeg-7.1.tar.xz`, `zlib-1.3.1.tar.gz`).
- Target folders (e.g., `x86_64-linux-gnu`, `x86_64-w64-mingw32`): Each contains build directories for dependencies.

Example structure:

```
work
├── src
│   ├── 15.0.0.tar.gz
│   ├── ffmpeg-7.1.tar.xz
│   ├── lua-5.4.6.tar.gz
│   ├── opus-1.3.1.tar.gz
│   ├── v1.4.33.tar.gz
│   ├── v2.10.1.tar.gz
│   ├── v7.349.0.tar.gz
│   ├── vulkan-sdk-1.3.296.0.tar.gz
│   ├── x264-a8b68ebfaa68621b5ac8907610d3335971839d52.zip
│   └── zlib-1.3.1.tar.gz
├── x86_64-linux-gnu
│   ├── nv-codec-headers
│   └── x264
└── x86_64-w64-mingw32
    ├── amf
    ├── ffmpeg
    ├── glslang
    ├── libplacebo
    ├── lua
    ├── nv-codec-headers
    ├── opus
    ├── SPIRV-Cross
    ├── SPIRV-Headers
    ├── SPIRV-Tools
    ├── txproto
    ├── vpl
    ├── x264
    └── zlib
```

To rebuild a specific contrib, navigate to its build directory and run the appropriate build command. Contribs are typically written in C/C++ and use build systems like autotools, CMake, or Ninja.

## Cleaning Up

There is no dedicated command to clean all build folders. To remove all build artifacts, use the following command:

```bash
rm -rf avserver/contrib/work libclient/contrib/work libkynput/contrib/work rootfs-x86_64-linux-gnu/* rootfs-x86_64-w64-mingw32/*
```

## Special Notes for Windows Builds

- **`-w` Option**: For `build-win32.sh`, the `-w` flag targets the `WINDOWS` subsystem instead of the default `CONSOLE` subsystem. See [MSDN documentation](https://learn.microsoft.com/en-us/cpp/build/reference/subsystem-specify-subsystem?view=msvc-170) for details.
- **`controller.exe` Behavior**: When built with the `CONSOLE` subsystem, `controller.exe` opens a `cmd.exe` window where all subprocesses log output. Note that `println!()` does not work when targeting the `WINDOWS` subsystem.
- **Packaging**: The build scripts generate a Unix-like folder structure. For Windows, the `-p` option packages the output into a flat structure in the `kyber-windows-x86_64` folder.
