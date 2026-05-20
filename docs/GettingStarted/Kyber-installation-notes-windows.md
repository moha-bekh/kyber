# Notes on Kyber installation on Windows

## Requirements

* Tested on Windows 10 / Windows 11 / Windows Server 2022
* An NVIDIA GPU with an up to date driver is highly recommended

## Download Kyber

### Using the Kyber installer

The easiest way to get Kyber installed on Windows is to use the Kyber installer. You can download it [from the Kyber installer project](https://gitlab.com/kyber.stream/apps/kyber-installer/).

### Without the Kyber installer (manual mode)

As an alternative method, you can download separately:

- the Windows client and server bundle: https://gitlab.com/kyber.stream/apps/kyber-desktop
* the Web client: https://gitlab.com/kyber.stream/apps/kyber-web.

The Windows client and server bundle zip file contains both the server and the
client side. The archive can be unpacked anywhere.

## Setup the server

### Using the Kyber installer

The Kyber installer will guide you through the steps needed to install Kyber on your machine.

### Without the Kyber installer (manual mode)

At first, make sure there are no installed version of Kyber.

Kyber requires to be started as a service. Here are the steps:

1. Run `install_service.bat`. It must be runned as Administrator
2. Run `start_service.bat`. It must be runned as Administrator

Kyber will be automatically started on PC startup. The service listens on port 8080 on both TCP and UDP.

### Add gamepad support

Kyber supports gamepads, but it requires to install a driver on server side: https://github.com/nefarius/ViGEmBus/releases/tag/v1.22.0.

### Uninstall a previous installation

Here are the steps to uninstall kyber:

1. Run `stop_service.bat`. It must be runned as Administrator
2. Run `uninstall_service.bat`. It must be runned as Administrator

## How to configure the listening port of the server

The file `kyber_config.toml` allows to configure the listening port.

To do this, uncomment the key `port` in section `[controller]`. Example:
```
[controller]
port = 8081
```

## Run the client

Run `client.exe <ip>` to connect to the server.

It is possible to specify the connection port: `client.exe --port <port> <ip>`.

### Shortcuts

* `Ctrl` + `Alt` + `F`: Toggle fullscreen

## Web client

NOTE: if you used the Kyber installer, the web client is already installed on your machine.

The archive contains two parts:
* The web client itself, in the `html` folder
* A test HTTP server, written in Python

It is possible to make the Windows server serve the webclient: just move and rename `html` to `webclient` alongside `controller.exe`. It will automatically serve the webclient on endpoint `/webclient/`. Example: `https://<host>:<port>/webclient/`.

It will show a simple test UI that allow to connect to the server.

### About TLS certificate

TLS test certificate has some hardcoded domains. One is `kybertest` that can be used for tests. Just add an entry in the client PC host files to make `kybertest` target the server IP.

### How to change the client parameters

The parameters can be set in the URL. Example: `https://<host>:<port>/webclient/?video_codec=hevc&bitrate=5000000`.

The list of existing parameterss can be displayed with the `Show doc` button.

## Notes about performance

Windows and NVIDIA drivers both have power management settings that try to reduce power consumption. This has two impacts:
* The CPU frequency varies a lot, this have an impact on the latency and the fluidity.
* The GPU default settings have a huge impact on encoding and decoding duration. Example: with a NVIDIA GTX 1080, we could get a 2,5 ms encoding duration for 1920x1080 frames with the correct settings. This duration can be 8 ms if the GPU reduces its power consumption.

To have a latency that doesn't change between tests, it is suggested to change the CPU and the GPU power management settings to produce the best performances.
