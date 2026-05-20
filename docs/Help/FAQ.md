# FAQ

## General

### What is Kyber?

Kyber is an open source cross-platform low-latency solution to perform remote control on many systems, from most widely used operating systems.

Kyber is mostly written in rust, and uses other open source solutions like VLC or FFmpeg.

Kyber network uses standard protocols underneath, like HTTPS and QUIC.

### Can I use Kyber to access my machine from the Internet?

Not yet. The QUIC protocol is not able to provide any form of peer-to-peer connection right now, so Kyber needs some alternative solution for that.

The easiest way to access your machine is to use some VPN setup or publish the Kyber network port. Be aware that you **need** to setup some proper authentication on the Kyber server before publishing it to the internet.

The Kyber project is working on other (secure) solution to make the access simple, but nothing to announce yet.

### Which network port(s) Kyber is using?

By default, Kyber uses only one port: `8080/TCP+UDP`.

### Can I use AV1 video codec in Kyber?

AV1 integration is highly experimental in Kyber (due to heavy browsers limitations especially), we do **not** recommend to use it for now.

We will publish a dedicated compatibility matrix for that specific codec soon.

### How can I launch the Kyber graphical interface?

Kyber desktop client does not include a graphical interface yet, but we're working on it!

It will be published very soon.

### Where can I find the Kyber client command line arguments?

You can check the [Kyber desktop README](https://gitlab.com/kyber.stream/apps/kyber-desktop) for a complete list and description of Kyber client arguments.

