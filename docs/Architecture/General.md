# Kyber

This document describes the target architecture of the Kyber solution.

## General Architecture

![remote-desktop-diagram](/uploads/ce3d70c1717d28e47e05c6b0a0e18116/remote-desktop-diagram.png)

The project is primarily written in the C and Rust programming languages. Pre-existing components written in C are kept, while new components are written in Rust as much as possible.

The choice of the Rust language is explained [here](#the-choice-of-the-rust-language).

The architecture aims to share as many components as possible between the client side and the server side. Indeed, since both operating modes are similar, although reversed, it is possible to build software bricks that can be adapted to different variations of the same use case, thereby reducing the development and debugging time required.

### Server

The overall architecture of the server-side solution is a multi-agent architecture. It is broken down into several processes, each with a specific role, which will be described in more detail later:

- *Streamer*: Based on **FFmpeg**, it is responsible for capturing, encoding and sending audio and video. This component is designed to be easily compatible with all targeted operating systems, as well as with the various video encoders available on the market
- *Input Server*: Responsible for injecting client input events
- *USB Service*: Manages *virtual* USB devices that are forwarded from the client
- *Mux*: A process placed between the previously mentioned services and the client. It is also present on the client side. It is the only process that performs network communications
- *Controller*: Manages authentication, receives client requests, launches and supervises the previously listed processes

This separation also makes it easy to manage the capture of multiple screens in parallel, thus supporting professional workstations.

Furthermore, it becomes easily conceivable to have multiple users connected to the same machine. The *Controller* is in charge of assigning access rights to the different clients and configuring each service appropriately.

For more details, you can refer to [here](#server-architecture).

### Client

The client application relies on the open source software **VLC** for audio and video rendering. Its use provides maximum hardware compatibility, as the effort of years of debugging on all types of platforms is instantly available. Despite these immediate qualities, development effort is needed to achieve minimal latency, which is not the primary purpose of this open source component.

Moreover, the same software bricks as the server are used for everything related to input, USB and networking. The technical fundamentals remain the same; only the final integration differs, since these components must be integrated into a client application that interacts with the end user's system.

cf. [here](#kyber-client-architecture) for more details.

### Input/Output Management

The capture, transmission and rendering of inputs/outputs, whether common input devices (keyboards, mice), more specialized ones (gamepad, graphics tablet), or acquisition devices (webcam, microphone, camera, etc.) is a bidirectional concern: if the project aims to be compatible with consumer or professional use cases, it is necessary to take them into account, both from client to server and from server to client.

This is why the project proposes a universal global approach based on a shared device virtualization and management library.

This strategy is described in details [here](#input-output-management-model).

### Data plane communication

We decided to rely on a shared communication architecture, primarily based on the proxification of transfers using the QUIC protocol[^quic]

[^quic]: https://quicwg.org/

This new protocol, originally designed for the *HTTP/3* web technology, is a priori an excellent candidate for unifying communications between client and server.

The benefits of this protocol are described [here](#choice-of-the-quic-protocol).

### Controller

The overall architecture of the server-side solution is a multi-agent architecture. As previously described, it is broken down into several processes, each with a specific role, such as the streamer and the input server.

The controller is the process that runs permanently on the server side: it is the client's entry point, and takes the form of an HTTP server whose role is to process client requests.

An example request is "Start a video streaming session", with an associated configuration, including the video codec to use. Once the command is received with its configuration, the processes required for its setup are launched and supervised. Thus, each component is launched with a specific mission and can be restarted in case of a crash. This architecture provides good isolation of responsibilities and good overall service stability.

Another major role of the controller is to manage user authentication with the services. Indeed, when a client requests to control a server, it must be verified that the client is actually authorized to do so. Similarly, the controller must describe to the various services it supervises which users are authorized and what operations they are allowed to perform. The controller is therefore the overall guarantor of system security, verifying and propagating authorizations to the different actors.

The controller's architecture must therefore allow interfacing with any type of authentication system, in order to be deployable in as many environments as possible.

It is important to note that the controller must be designed flexibly enough to also be embedded in as many applications as possible. A typical example is a *Parsec*-type application that allows an individual to make their personal computer accessible from outside their home.

### Benefits of the Architecture

The goals of this separation are as follows:

- Isolate software crashes within specific perimeters. Thus, an input service crash will have no impact on the video part
- Segment the components at the organizational level. It then becomes easier for multiple teams to work on the project, each being responsible for maintaining one or more component(s)
- Segment the technical responsibilities of components in a precise and strict manner. A well-separated architecture makes it easy to determine where and how to add a new feature
- Isolate the authentication brick so that its implementation is substitutable, thus being able to handle any type of authentication backend
- Isolate network protocol responsibility at a single point. Specialized and dedicated people can work on this complex task that requires specific expertise. Furthermore, it becomes easy to handle different types of network protocols

This entire software stack can be deployed directly on a physical machine, but also in a virtualized environment. It is thus possible to adapt to multiple client use cases.

This flexibility makes it easy to add support for a new operating system, a latest-generation video encoder, etc. but also to adapt to the technical environment of a new usecase.

## In details

### The Choice of the Rust Language

The Rust language has been developed by *Mozilla Research* since 2006 with the goal of creating a modern, cross-platform language focused on robustness and security, while remaining focused on high performance. It positions itself as a competitor to the C and C++ languages, which historically occupy the segment of applications with critical performance and memory consumption needs.

To illustrate the global context, *Google* announced that memory management errors in Android represent the majority of bugs, as well as 70% of major vulnerabilities. *Microsoft* published a similar document, citing the same figure of 70% regarding major vulnerabilities related to memory bugs. This observation is shared by other market players, making interest in this language ever greater. The *Rust Foundation*, which notably includes *Amazon*, *Google*, and *Microsoft*, was created in 2021 to provide legal and financial support to the Rust project.

Similarly, the language is experiencing rapid growth, and many major projects now make its use possible. Notable examples include the Linux kernel and the Android project. Other major companies have publicly announced that they have begun integrating Rust into their technology solutions, for example to solve performance problems or to improve the robustness of critical software bricks. It therefore seems reasonable to think that Rust is mature enough to be used on a new project and that it has a sustainable future. Moreover, the number of developers showing interest in this language continues to grow.

Rust is therefore a language suited to our scope of activity, in terms of portability, maturity and performance.

## Input/Output Management Model {#input-output-management-model}

### Keyboard/Mouse/Gamepad Capture

In order to control a remote machine, it is necessary to be able to accomplish two things:

- Capture keyboard/mouse/gamepad events from the client machine and inject them on the server side
- Capture the cursor shape from the server machine and inject it on the client side

These two elements provide an effective and immersive user experience, as the user gets the same experience as if they were directly using the server machine.

However, this approach has a major drawback: it is impossible to handle all existing peripherals. Indeed, some users would for example want to be able to use a USB key, while professionals would want to be able to use a graphics tablet.

### USB Device Forwarding

A second approach, complementary to the first, allows handling a maximum of existing USB devices: USB device forwarding.

The principle is to redirect the USB communication between a device and the client toward the server machine. The user will see their graphics tablet appear on the remote machine and will be able to use it transparently. It then becomes possible to use all available USB devices in a generic manner.

### Architecture: Keyboard/Mouse/Gamepad Capture

The different operating systems allow obtaining the various events natively. It is also possible to inject the same events, and thus replay sequences captured on the client side. However, each system has its own way of exposing event capture and injection, so it is necessary to create as many acquisition/injection implementations as there are supported systems.

To make the systems interoperable, it is necessary to normalize the way events are represented when sent over the network. Indeed, each system uses its own system to represent a keyboard key, a mouse button, and other peripherals. Each implementation must conform to this normalized representation, thus allowing the different systems to communicate with each other reliably.

From a more global perspective, whether on the client or server side, each event is produced either by the system or by the network. In all cases, each produced event passes through a *Router* that determines which component will receive the event in question.

It then becomes quick to add support for a new system, whether client or server. Indeed, it is sufficient to add an acquisition or injection module that respects the normalized representation of the different events.

Regarding network communication, in the same way as for audio and video, the network part is offloaded to the *Mux*. However, it is important to note that input events must never be lost, particularly button presses. The network part must therefore take this specific constraint into consideration.

![213_pipeline.svg](/uploads/73bf23e2dfba4159c85c89818ad36c9c/213_pipeline.svg)

### Architecture: USB Device Forwarding

Modern operating systems allow creating USB drivers to add support for new peripherals. It is thus possible to create a driver that arbitrarily handles any device physically plugged into the client machine.

The principle is as follows: the driver on the client side takes charge of the peripheral, which is then no longer presented to the user on their machine. Instead, the exchanges performed via the USB protocol are redirected to the server machine. The server also has a special USB driver that allows plugging in so-called *virtual* devices. The USB packets are thus injected into the server operating system, which will act as if the peripheral were physically plugged in.

![213_usb.svg](/uploads/11a6d1c1a7fa2de2d53a149517dd4b61/213_usb.svg)

In the same way as for a keyboard or mouse, it is necessary to normalize the protocol responsible for transporting USB packets. There is an implementation called *usbip*[^usbiplinux] in the Linux kernel, which could serve as a basis for our final implementation.

[^usbiplinux]: https://docs.kernel.org/usb/usbip_protocol.html

## Kyber Client Architecture

### Multimedia Player: Zero-Latency VLC

As previously explained, VLC offers a significant number of advantages. It indeed supports a wide range of platforms and audio/video formats.

However, VLC is designed to play audio and video as smoothly as possible, while ensuring precise synchronization between these two streams. This operating mode is incompatible with our performance objective. Indeed, the pursuit of smoothness and synchronization requires introducing buffers at multiple levels, synchronization points between streams, which inevitably introduces latency.

VLC has therefore been modified to remove all of these mechanisms. The new strategy reverses the logic by forcing images to be sent to the decoder as quickly as possible, as soon as they are received at the network level. Similarly, the decoders have been configured to deliver images as quickly as possible. Finally, display always uses the latest available image. All these modifications put together ensure that the time elapsed between receiving an image on the network and displaying it is reduced to the maximum.

#### Adapting the VLC Core

To achieve minimal latency, architectural changes must be applied at multiple
levels. Some prototype has been developed on a separate fork, where we enable the
very low latency mode via a new `--0latency` parameter. This parameter will
change the behavior of different VLC components.

### Server Architecture

#### Purpose and Scope

The streamer's purpose is to perform audio and video capture and encoding, and to be flexible enough to work on all platforms. Indeed, the different operating systems all work differently regarding audio and video capture. Likewise, video encoders all work differently depending on the systems, and even depending on hardware manufacturers.

The encoded stream is then sent to a network layer called *Mux*, which aggregates multiple streams and sends them over the network.

#### Server Architecture

The streamer is designed to be able to describe a capture and encoding pipeline dynamically. It is also based on *FFmpeg*, in order to quickly have access to a wide range of pre-existing audio and video encoders. These two characteristics provide maximum compatibility in the targeted heterogeneous ecosystem, while reducing development time through the use of an open source component.

For each supported platform, dedicated audio and video capture modules will need to be written in order to achieve the best possible performance. Since *FFmpeg* has limited support for this type of functionality, it is necessary to create system implementations that use the most advanced APIs to achieve the best possible performance.

Once the capture modules are available, it is sufficient to describe an audio or video pipeline, which is composed of:

- Capture module
- (Optional) Video filter. Allows for example to resize the image, perform colorimetry operations, etc.
- Encoding. The encoder type can be chosen, as well as the codec used, the bitrate
- Network layer. Sends the compressed stream by default to the *Mux*, but can be configured to send directly over the network for debugging purposes

Regarding video, it is possible to capture the final image in the CPU or directly in the GPU. Similarly, the *x264* encoder runs on the CPU, while *NVENC* works directly in the GPU. The streamer is capable of handling any video pipeline topology, performing appropriate CPU <-> GPU transfers depending on the situation. This flexibility allows being very adaptable depending on the capabilities offered by the server machine.

Audio does not have the same constraints: the CPU consumption of encoding is quite reasonable, and the audio stream sent to the sound card to be played is built by the CPU. An audio pipeline will always be executed by the CPU.

Each component has its own execution thread, and each pipeline stage sends its data to the next component via a FIFO. This architecture allows each component to perform its task autonomously, and thus achieve optimal responsiveness.

#### Pipeline Examples

##### Windows

On Windows, it is possible to capture an image directly in the GPU by retrieving a Direct3D texture, and NVENC is capable of working directly on this type of data. In this configuration, performance is optimal since the GPU directly provides the entire Capture + Encoding process.

![212_pipeline_dxgi_nvenc](/uploads/aabf2921f9c9061207c66431fa3abc6f/212_pipeline_dxgi_nvenc.png)

##### Linux

On Linux, we can consider a scenario where it is only possible to perform capture on the CPU side, while performing encoding on an Intel GPU using VAAPI. Performance is lower compared to the previous example, but we adapt to the capabilities offered by the platform.

![212_pipeline_xcbshm_vaapi](/uploads/adfed9ddfea74b3cb9663282f01d4fa2/212_pipeline_xcbshm_vaapi.png)

### Choice of the QUIC Protocol

**Selection Criteria**

During preliminary studies, we examined a number of network protocols capable of transporting any data between the client and the server.

For this, we identified the following set of criteria:

- a lightweight protocol, limiting the ratio between actual data size and overall packet size;
- a multi-session protocol, allowing multiple communication channels;
- native security and in particular confidentiality, through encryption of communications;
- flexibility in the choice of communication modes with or without loss. Indeed, if a protocol (like TCP) offers retransmission and ordering capabilities, these necessarily add additional delay that can harm overall latency;
- compatibility with network filtering systems (enterprise firewalls), particularly for opening remote connections.

**QUIC**

Some relatively widespread protocols satisfy some of the criteria: notably RTP, which is a lightweight and multi-session protocol, or WebRTC, well handled by firewalls as it is used in most videoconferencing solutions. RTP was indeed our first choice for testing during the feasibility study.

The results of our research show that the QUIC protocol^[https://datatracker.ietf.org/doc/html/rfc9000], proposed by Google engineers, seems to meet most of the project's needs.

It is the basis of the *HTTP* protocol extension in its *HTTP/3* version^[https://en.wikipedia.org/wiki/HTTP/3], replacing notably the combination of TCP (for transport) and TLS (for encryption), on top of a UDP frame.

Among the interesting characteristics of this protocol, it natively integrates:

- the ability to simply negotiate a protocol version upgrade to switch from an earlier version of the HTTP protocol to a QUIC connection - thus making it easier to handle connection initializations through firewalls;
- native TLS encryption (1.3 for the first version of the RFC)
- a concept of unidirectional or bidirectional independent communication *channels* (*streams*), enabling data multiplexing within a single connection
- the latest protocol extension proposals[^unreliable] offer a choice between a reliable *stream* and a *stream* with possible loss.

[^unreliable]: RFC 9221 is being stabilized: https://datatracker.ietf.org/doc/html/rfc9221 , and the first experimental implementations are beginning to appear in libraries implementing the QUIC protocol.

Furthermore, the QUIC protocol allows significantly reducing the connection establishment time[^quicvstcp], which enables responsiveness improvements at the initialization of client/server communication, but also during reconnections (after a network outage, for example).

[^quicvstcp]: https://github.com/Shenggan/quic_vs_tcp

*QUIC* therefore seems to be an excellent candidate for the project, provided that the solution is capable of properly multiplexing all the information it needs to transport.

### Data plane exchange proxification

The *Mux* is the central point that manages the network: it enables the implementation of a network protocol suited to low latency, encrypted, and capable of traversing enterprise firewalls. It is therefore a vital component for the proper functioning of the product.

Furthermore, this single brick handling the network provides additional flexibility since it can support multiple protocols easily. Indeed, even though we aim to support a network protocol suited to our latency and performance constraints, it will sometimes be necessary to adapt to pre-existing protocols. A notable example is the creation of a web client that may need to use the *WebRTC* protocol.

It is finally possible to imagine the possibility for a client to implement an additional network protocol as a plugin. This possibility allows covering even more use cases, and leaving the implementation of a specific protocol to third parties.

#### Kymux - QUIC Proxification

In order to make the architecture more modular, we want to extract all the
communication between the client and the server into a separate component
(called Kymux), executed in a separate process. Thus, if the encoding crashes
for any reason, the connection is not lost and can be restarted transparently
for the user.

There are many streams to transmit between the client and the server: video,
audio, keyboard/mouse/controller inputs... And this in both directions: the
client can send its webcam video, its microphone sound...

The idea for this is to use a single QUIC connection (a recent transport
protocol developed for HTTP/3), necessarily encrypted, with multiple data
streams, reliable (like TCP) and unreliable (like UDP).

![kymux.svg](/uploads/a4f419e9d18200da3ba5963563315905/kymux.svg)

All the protocol complexity (error correction, packet loss management, etc.) is
intended to be handled by Kymux.

The capture processes (`avserver` in the diagram above) send raw packets to Kymux
via IPC (inter-process communication, currently TCP), the Kymux server transmits
them to the Kymux client, and the final client (here VLC) receives the packets
in order, via IPC.

Note that IPC strategy is not meant to remain in TCP: it should evolve to more secure and efficient stacks (pipes, shared memory, etc.).
