# Workspace Documentation

## Overview

This document provides a high-level description of the workspace structure, which consists of multiple repositories used to build applications and their dependencies within the Kyber environment.

Each repository follows a consistent structure for build scripts, external dependencies, and third-party software integration. Some repositories depend on others, and certain repositories are designated as "main" repositories responsible for building final applications.

## Repository Structure

All repositories in the workspace include the following components:

- **Build Scripts**: A set of `build-<platform>.sh` scripts (e.g., `build-linux.sh`, `build-windows.sh`, `build-macos.sh`) that manage the build process for the repository on specific platforms.
- **`external` Folder**: Contains git submodules that track internal forks of external dependencies, maintained for project-specific compatibility and modifications.
- **`contrib` Folder**: Contains build scripts for third-party software, which can either:
  - Fetch official sources and apply patches.
  - Use forks stored in the `external` folder.

## Key Repositories

The workspace includes the following repositories:

- **`kymux`**: Implements a network stack using QUIC and WebTransport protocols.
- **`libkypc`**: Provides functionality to spawn processes and establish inter-process communication (IPC).
- **`txproto`**: An open-source streaming solution based on FFmpeg.
- **`avserver`**: Integrates `txproto` into the Kyber environment for audio and video streaming.
- **`libkynput`**: Handles input capture and injection across supported platforms, including the `inputserver` component.
- **`controller`**: The server-side main process that processes client requests, utilizing `kymux`, `avserver`, and `inputserver`.
- **`libclient`**: The client-side component of the Kyber stack, integrating `kymux`, `vlc`, and `libkynput`. Includes a video and audio player for web platforms.
- **`kyaudioreg`**: Used by `vlc` and the `libclient` web audio player for buffering to maintain low latency and handle audio drift.
- **`kywasmtime`**: Implements `tokio::time` for web platforms.

## Repository Dependencies

Some repositories depend on others within the workspace. Examples include:

- **`controller`**: Depends on `libkynput` and `avserver`.
- **`libclient`**: Depends on `kymux`, `vlc`, and `libkynput`.
- **`kyaudioreg`**: Used by `vlc` and the `libclient` web audio player.

Dependencies are managed by the build system, which ensures sub-repositories are fetched and built in the correct order.

## Main Repositories

The following repositories are designated as "main" repositories, responsible for building final applications:

- **`kyber-desktop`**: Builds clients for Windows, Linux, and macOS.
- **`kyber-web`**: Builds the web-based client.
- **`kyber-android`**: Builds the Android client (published soon).
- **`kyber-ios`**: Builds the iOS client (published soon).

Each main repository contains a `README.md` file with detailed instructions specific to that repository.

### Responsibilities of Main Repositories

Main repositories handle the following tasks:

1. **Fetching Sub-Repositories**:
   - Retrieve required sub-repositories (e.g., `kymux`, `libkynput`, `avserver`) using git submodules or other dependency management mechanisms.

2. **Generating `.cargo/cargo.toml`**:
   - Create a `.cargo/cargo.toml` file to link shared Rust crates across sub-repositories, ensuring proper dependency resolution.

3. **Building Sub-Repositories**:
   - Orchestrate the build process for dependencies, ensuring sub-repositories are built in the correct order.

4. **Building the Final Application**:
   - Compile and package the final application for the target platform(s).

## Build Process

The build process for each repository includes the following steps:

1. **Execute Platform-Specific Build Script**:
   - Run the appropriate `build-<platform>.sh` script (e.g., `build-linux.sh`) for the target platform to handle platform-specific configurations.

2. **Handle Third-Party Software**:
   - Use scripts in the `contrib` folder to fetch and build third-party dependencies, either from official sources with patches or from forks in the `external` folder.

3. **Resolve Dependencies**:
   - Fetch and build sub-repositories in the correct order to satisfy dependency requirements.

4. **Build the Repository**:
   - Compile the repository's code, linking against dependencies as specified in the `.cargo/cargo.toml` file (for Rust-based projects) or other build configurations.

5. **Package the Application (Main Repositories Only)**:
   - Package the final application for distribution on the target platform(s).
