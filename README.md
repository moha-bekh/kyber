# Kyber

Kyber is an open source cross-platform very-low-latency solution to remote control any type of machines,
from remote desktop to drones and robots, including cloud rendering and gaming, or AI visual agents,
based on VLC, FFmpeg and QUIC.

The goal is to achieve the absolute lowest latency possible, *because latency matters more than anything,
when you are controling a machine*, while being cross-platform, multiple usages and hardware,
supporting all type of streams *(video, audio, subtitles, sensors)* and controls *(mouse, keyboards, gamepads, I/O)*.  
It supports all codecs, hardware encoders and decoders and uses QUIC protocol to
mux all streams and controls on one single encrypted connection.

It can be used to control or observe distant machines, distant applications, drones and robots.  
It can also be used to record and train robotic AI models.

Let there be light!

## Technical architecture

We want to use VLC and FFmpeg, as much as possible, to be able to reuse the portability
over all platforms, and not spend too much time on each platforms, to have the video quality
and video filters of VLC, and be able to have streaming not only on Windows, but on Linux
and mac too.

The whole pipeline from encoder to decoder to display must be pushed-based, which means we need
to modify VLC and its clock, do a push video server using FFmpeg (libavcodec+libavfilter) and
rely on QUIC to be sure to achieve the lowest latency possible.

The architecture is modular, splitting the video server, the input server, the muxing server,
in different processes, and most of it must be stateless, to be able to recover on crashes,
but also to make it faster to develop for.
It might be also simpler to restart the video server on topology changes (resolution, codec, ...)
than handling correctly the changes in real time.

We use Rust everywhere, except VLC and FFmpeg (of course).

We want the project to be an SDK, because they might be other use cases (drones or audio streaming)
that we have not thought about yet. The SDK will be projected on other languages.

## This repository

This repository is the main Kyber repository, the introduction, aka "Where to start" project, since Kyber
is split over multiple repositories, for each component of the project.

It also contains the main documentation of the project.

## Kyber tree organization

Kyber is split into multiple separate groups of repositories:

- `core`: core projects of Kyber, containing Kyber specific code.
- `deps`: dependency projects needed by Kyber where some changes need to be applied (forks).
- `apps`: Kyber applications using Kyber core projects.
- `ops`: Kyber Operation tools (CI, CD, QoL)

### Core projects (`core` subgroup)

- `kyctl`: Kyber control plane components. They manage the communication initialization, authentication, and the orchestration of the other elements needed by Kyber, both on client and server sides.
- `kymux`: Kyber data plane components. Any data (video, audio, input events, file transfer, usb, etc.) is transferred through this backend. It provides multiple transport strategies, including a protocol designed to transport Kyber data other the QUIC protocol.
- `kynput`: Kynput provides the client and server components responsible for the capture and injection of any kind of input events and actions. It manages keyboard events, mouse events, gamepads (including rumble), clipboard, etc.
- `kymedia`: Multimedia components of Kyber. Provides the features related to audio, video, etc. capture/display, encoding/decoding, muxing/demux, used by the Kyber solution.
- `kyutil`: Regroups components used by most of the other core components of Kyber (like IPC). 

### Applications (`apps` subgroup)

Kyber is available on most platforms, including browsers.

- kyber-desktop: provides the Kyber servers and clients for Windows, macOS and Linux distributions.
- kyber-web: the browser-based Kyber client.
- kyber-android: the Kyber application for Android.
- kyber-ios: the Kyber application for iOS and any similar operating system (iPadOS, tvOS, etc.)

## License

Any project created in the context of Kyber is or will be under a double license: Commercial or GNU Affero GPL v3.0 or Later.

The commercial license allows people to use and integrate the project without having to open source their whole stack and will help fund the project.

The dual-license applied to all projects of Kyber, *(even the ones not listed above)*.

# CoC
De facto, the VideoLAN CoC is in use, until we create another one.

