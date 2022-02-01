# Kyber

Kyber is an open source cross-platform low-latency solution to do remote desktop
and cloud gaming, based on VLC, FFmpeg and QUIC.

The goal is to achieve the lowest latency possible, because latency more than anything,
while being cross-platform, supporting all codecs, all hardware encoders, using QUIC protocol
to mux all streams and controls on one connection.

It is a bit like Parsec, but open source, cross-platform and using QUIC.

Let there be light!

## Technical architecture

We want to use VLC and FFmpeg, as much as possible, to be able to reuse the portability
over all platforms, and not spend too much time on each platforms, to have the video quality
and video filters of VLC, and be able to have streaming not only on Windows, but on Linux
and mac too.

The whole pipeline from encoder to decoder to display must be pushed-based, which means we need
to modify VLC and its clock, do a push video server using FFmpeg (libavcodec+libavfilter) and
rely on QUIC to be sure to achieve the lowest latency possible.

The architecture will be modular, splitting the video server, the input server, the muxing server,
in different processes, and most of it must be stateless, to be able to recover on crashes,
but also to make it faster to develop for.
It might be also simpler to restart the video server on topology changes (resolution, codec, ...)
than handling correctly the changes in real time.

We will try to use Rust everywhere, except VLC and FFmpeg (of course).

We want the project to be an SDK, because they might be other use cases (drones or audio streaming)
that we have not thought about yet. The SDK will need to be cross-languages.

## Kyber project organization

Kyber will be split into multiple separate repositories, each of them dedicated to a specific components.

### Core projects

- **controller**: the controller project is, de facto, the server side control plane of Kyber. It manages the communication initialization, authentication, and the orchestration of all the other elements. It should be the only one maintaining state on the server side.
- **libclient**: libclient is the client side of the controller. It starts the communication to the server controller, and it knows about the client side capabilities, and will be the player (demux, decode and display) the audio/video streams
- **kymux**: kymux is the muxing part of Kyber. It aggregates all the data (video, audio, input events, file transfer, usb, etc.) and prepares the muxing for mutliple protocols (QUIC, RTP, WebRTC?)
- **kyproto**: kyproto is THE implementation of a protocol based on QUIC to transport Kyber streams.
- **libkypc**: is an IPC (Inter-Process Communication) system for Kyber, done notably to channel the streams from the video and input servers to the muxing layers.
- **avserver**: avserver is a push-based GPU-accelerated video server focused on grabbing audio and video from the desktop.
- **libkynput**: libkyinput is the core of the input server, responsible for both the capture and the injection of any kind of input events, on all platforms. It supports keyboard, mouse gamepads (including rumble), clipboard, USB, etc.

### Applications

Kyber will be available on most platforms, including browsers.

- **desktop-client**: desktop-client will provide the server and clients for Windows, macOS and Linux distributions.
- **web-client**: web-client will provide the browser-based client.
- **android-client**: android-client will provide the Kyber application for Android.
- **ios-client**: ios-client will provide the Kyber application for iOS and any similar operating system (iPadOS, tvOS, etc.)

## License

Any project created in the context of Kyber is or will be under a double license: Commercial or GNU Affero GPL v3.0 or Later.

The commercial license allows people to use and integrate the project without having to open source their whole stack and will help fund the project.

The dual-license will apply to all projects of Kyber, *(even the ones not listed above)*.

# CoC
De facto, the VideoLAN CoC is in use, until we create another one.

