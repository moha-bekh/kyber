# Troubleshooting Guide

## General

### Gamepad not detected

- When using the Windows version of Kyber server, be sure to install Vigem as described in the [intallation notes](../GettingStarted/Kyber-installation-notes-windows.md#add-gamepad-support)
- Kyber has been tested mostly with XBox360 controllers and PS4 controllers. These should work out of the box
- For other types of controllers, check the compatibility with

### The clipboard is not shared

Clipboard sharing is currently only supported by:

- the Kyber server on Windows
- using either the Windows (native) client or the web client on Chromium.

For clipboard sharing to work, clipboard access must also be allowed in the `kyber_config.toml` on the server. See `kyber_config.toml` for more details.

### I have a dual GPU server and Kyber is selecting the wrong one

On systems with multiple GPUs, especially with an integrated GPU (iGPU) and a dedicated GPU, Kyber may select the integrated GPU by default, causing performance issues.

Kyber does not include an easy way to select the GPU used for grabbing and encoding *yet*. As a workaround, we invite you to disable the unused GPU in the BIOS settings.

## Microsoft Windows

### No display

Check you have a physical screen attached to the main GPU.

Microsoft Windows requires a monitor to enable desktop grabbing.

Note: the Kyber project will published a solution for that soon!

### Black screen with QSV encoder

We are aware of some issues (black screen) occurring when using Kyber with the QSV encoder and some specific intel CPUs (like the N100/N150 generation, for example).

### Mouse cursor not displayed

If you are using Kyber on a computer without a plugged-in mouse, Windows does not display the cursor by default.

**Solution:** Enable "Mouse keys" in Windows accessibility settings.

**[See tutorial](./Guides/mouse-cursor-not-displaying.md)**
