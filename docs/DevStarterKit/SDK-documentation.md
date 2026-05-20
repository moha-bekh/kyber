# Kyber SDK Documentation

## Overview

The Kyber SDK is primarily written in Rust, with a core library and multiple language bindings to facilitate integration with various platforms. The client-side APIs are implemented in Rust, which can pose challenges for integration with other languages. To address this, the SDK is structured as:

- **Core**: Written in Rust.
- **Bindings**: Language-specific wrappers to simplify integration.

## Client-Side SDK

The client-side SDK consists of two main libraries:

- `libclient`: Core client functionality.
- `libkynput`: Input handling for client applications.

### Existing Bindings

- **Desktop Platforms**:
  - **C Binding**: Generated using `cbindgen` for Windows, macOS, and Linux.
- **Web Platforms**:
  - **JavaScript Binding**: Generated using `wasmbindgen` for web applications.
- **iOS (soon to be published)**:
  - Currently uses the C binding directly in the demo application.
  - An intermediate Swift layer to provide a native Swift API for better developer experience is under development
- **Android (soon to be published)**:
  - Uses the C binding for the JNI (Java Native Interface) layer.
  - The final API is written in Kotlin, building on the JNI layer.

![Sans-titre-2025-10-08-16453.svg](/uploads/17d2668ab47a1d40b379aac714bb4157/Sans-titre-2025-10-08-16453.svg)


