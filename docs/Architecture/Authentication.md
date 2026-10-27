# Kyber Authentication
## Overview

### Background

Kyber currently operates without client authentication, allowing unrestricted
connections. Implementing a robust authentication system is essential for
transitioning out of the prototype phase.

### Objectives

This document describes the basis of a comprehensive authentication mechanism across all Kyber communication channels:

- HTTP control plane
- WebSocket control plane  
- QUIC data plane

### Design Requirements

Kyber should be designed for integration within complex service meshes and
distributed architectures. The authentication system provides flexibility for
DevOps teams to integrate with existing authentication infrastructure while
maintaining minimal codebase impact.

The implementation follows a cookie-based session management approach with
pluggable authentication backends, enabling interoperability with various
authentication systems while preserving a single session handling system for the
internals of Kyber.

## Architecture

### Secured Connection establishment

The kyber authentication model mainly revolves on TLS to establish secure connections, and uses mutual authentication workflows to gain bidirectional trust before using establish connections for client <-> server actual communication.

A standard Kyber connection uses three types of protocols to manage all the commucation between the client and the server (called controller):

- **HTTPS**: used for control plane client -> server actions
- **WSS** (Secure Websocket): used for control plane server -> client notifications
- **QUIC** (for native clients) or **WebTransport** (for web clients): used for data plane

To have the whole Kyber communication being secured and trusted by both the client and the server, Kyber protocol needs to establish a secured and trusted connection from both side of each protocol.

### Reminder: TLS handshake (simplified)

```mermaid
sequenceDiagram
    client->>server: sends "ClientHello" (SSL/TLS versions, cipher suites)
    server->>client: sends "ServerHello" (highest SSL/TLS version, cipher suite)
    server->>client: sends server certificate
    client->>client: validates server's certificate
    client->>server: sends encrypted premaster secret
    server->>server: decrypts premaster secret and computes session key
    Note over client, server: secure connection established
```

### Secure connection and server -> client trust: TLS handshake

The standard TLS connection already provides one-side verification, where the client:

- can check the server certificate validity
- can match the server certificate subject common name with the domain name used 

Kyber uses that standard mecanism the check both and authentify the server (controller) on the client side.

This is the case for all three protocols (HTTPS, WSS and QUIC/WebTransport), as all three uses TLS for securing connection.

## Control plane connection establishment and bidirectional trust

### General Workflow

```mermaid
sequenceDiagram
    box transparent Control plane initialization
    participant client
    participant controller
    end
    rect rgba(0, 0, 255, .1)
        Note over client, controller: HTTPS
        client->>+controller: start TLS handshake
        client->>client: check HTTPS server certificate
        controller->>-client: end TLS handshake
        Note left of client: the HTTPS server is now<br> authenticated by the client,<br>the HTTPS connection is<br>trusted by the client
        client->>+controller: performs authentication workflow on HTTPS /session/login
        controller->>controller: validates client authentication workflow
        Note right of controller: the client is now<br>authenticated by the controller,<br>the HTTPS connection is<br>trusted by the controller
        controller->>controller: generates a session_cookie, computes session_cookie validation duration/end time, generates a one-time token for WebSocket authentication
        controller->>-client: sends session_cookie, websocket_token and validation duration
    end
    rect rgba(0, 255, 0, .1)
        Note over client, controller: Secure Websocket (WSS)
        client->>+controller: start TLS handshake
        client->>client: check WSS server certificate
        controller->>-client: end TLS handshake
        Note left of client: the HTTPS server is now<br> authenticated by the client,<br>the WSS connection is<br>trusted by the client
        client->>+controller: sends websocket_token (first message)
        controller->>controller: checks websocket_token (presence and end time)
        Note right of controller: the client is now<br>authenticated by the controller,<br>the WSS connection is<br>trusted by the controller
    end
```

### server's certificate check from client

**webclient**

Browsers are quite strict on the certificate validation for HTTPS and WSS, and enforces that:

- the client checks the server's certificate is valid regarding the browser's certificate authorities policy (or add an explicit user's exception)
- the client checks the server's domain name matches the certificate's subject common name or alt names

As a consequence, one the TLS hanshake is done, the client has de facto verified the server's identity and can trust it.

**native clients**

For native clients, Kyber uses the exact same strategy, with a native TLS implementation:

- the client checks if the server's certificate is valid regarding the given certificate authorities policy (the operating system's one by default) or an explicit user's exception
- the client checks the server's domain name matches the certificate's subject common name or alt names


### Authentication Backends

Authentication backends are modular Rust components that implement specific
authentication methods. This "plugin" architecture enables extensibility of the
supported authentication methods and allow for easy activation of a prefered
method.

Supported authentication methods could include:

- JSON Web Tokens (JWT)
- OAuth 2.0
- Custom authentication schemes
- Basic authentication

An authentication backend module should have the following implementation:
```rust
/// Backend initialization routine.
pub(super) fn init(config: &Config) { }

pub struct Session {
    pub username: String,
    pub expiration: Option<OffsetDateTime>,
}
/// Perform the authentication method on the credentials, returns the assigned
/// identity.
fn authenticate(credentials: &str) -> Result<Session, Error> { }
```

#### Supported Backends

##### Basic Authentication

A development-focused, passwordless authentication scheme is enabled by default
for testing scenarios. This backend accepts any username without password
validation, following the HTTP Basic Authentication scheme as defined in RFC
7617[^basic-auth-rfc]. This authentication method **must** be disabled on
production environments.

**Authorization Header Format:**
```
Authorization: Basic dXNlcm5hbWU6==
```

For compatibility with RFC 7617, the token contains a base64-encoded
`username:password` pair where the password field is ignored.

##### JWT Authentication  

JWT are supported via the Bearer authentication scheme (RFC 6750[^bearer-auth-rfc]):

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.ey...
```

**Features:**

- Supports the `exp` (expiration) claim for automatic session expiration
- Compatible with `HS256` and `RS256` algorithms in the first implementation
- Configurable via the main TOML configuration file

**Configuration Example:**

```toml
[kycontroller.auth.jwt]
algorithm = "HS256"
key = { plain = "kyber-authentication-development-key" }
```

A `jwt-gen` utility binary is provided for development token generation:

```text
Usage: jwt-gen [OPTIONS]

Options:
      --audience <AUDIENCE>      Standard audience claim (`aud`) [default: kyber] [aliases: --aud]
      --subject <SUBJECT>        Standard subject claim (`sub`) [default: "test user"] [aliases: --sub]
      --expiration <HUMAN TIME>  Expiration time of the token (`exp`) [default: 2h] [aliases: --exp]
      --algorithm <ALGORITHM>    Token encoding algorithm [default: HS256]
      --key-plain <RAW KEY>      Specify the key as a raw string argument
      --key-path <PATH>          Specify a file path containing the key/certificate
  -h, --help                     Print help (see more with '--help')
  -V, --version                  Print version
```

**Notes**

This authentication backend is meant to be used in coordination with an *external* source of authentication.

It means the application is responsible to manage the JWTs lifecycle and the session renewal.

As a consequence:

- JWT tokens should come from an external source to libclient, aka from the application side. Either the application is able to generate it, or can use a delegation service that is able to provide some valid JWT.
- The `/session/renew` action is published by libclient to that application so that the application is able to perform the renew external workflow of the JWT (generating a new JWT with an updated expiration date). It is manually triggered by the application if it has to (libclient will not trigger it automatically).
- `/session/renew` needs a valid user session cookie and a new JWT to be valid. If the client has access to a valid JWT but not to valid session cookie, it needs to restart the login/authentication process (/session/login).

### HTTPS Authentication

#### Authentication Middleware

Kyber implements a custom authentication middleware built on
actix-session[^actix-session] to minimize authentication-related boilerplate
code throughout the application.

**Design Decision:** The implementation uses a custom middleware rather than
actix-identity[^actix-identity] due to specific requirements:

- Per-session expiration time configuration (essential for multi-backend authentication)
- Direct control over session cookie contents (currently limited to expiration time and user ID)
- Simplified architecture aligned with Kyber's specific use cases

**Usage Example:**
```rust
#[post("/protected_endpoint")]
async fn endpoint(ctrl: web::Data<Mutex<Controller>>, user: Identity) -> HttpResponse {
    println!("Authenticated user: {}", user.uid().unwrap());
    // Endpoint logic here
}
```

#### Authentication Endpoints

##### Login (`/session/login`)

Clients authenticate by sending credentials via the `Authorization` header to
the `/session/login` endpoint. Upon successful authentication:

1. A unique UUID (v4)[^uuid] is assigned as the user identifier
2. The Kyber session is started
3. A session cookie and its expiration time are created and returned
4. A one-time WebSocket authentication token is generated

**Response Format:**
```json
{
    "uid": "9c5b94b1-35ad-49bb-b118-8e8fc24abf80",
    "websocket": "7vaag596mfrsvlzzo8298yhv70k7hrrw6p5iysprxx9dbykawwn2glm778ask4hqpk61i5bsmclq07kdkyfkj14j66u2d36bb3x35s9m5wwfip66bedxk6801nl6sa4t"
}
```

Any further client HTTPS request can then use the session cookie for authentified actions as long as the cookie is still valid (not expired/revoked).

##### Session Renewal (`/session/renew`)

Sessions may expire based on the underlying authentication method's expiration
policy. Expiration is enforced through:

- Identity middleware validation on each HTTP request
- Automated cleanup task running every 30 seconds to remove expired sessions

To prevent session expiration, clients must renew their sessions by providing
renewed credentials to the `/renew` endpoint using the same `Authorization`
header format as initial login.

**Note:** Session renewal is only required through HTTP endpoint since WebSocket
and QUIC connections lifetime are derived from their TLS stack.

##### Logout (`/session/logout`)

Client can notify disconnect through the `/session/logout` endpoint. A session logging
out will kill all the current sessions on each protocol (HTTPS, WSS, QUIC/WebTransport).

### WebSocket Authentication

WebSocket connections present unique authentication challenges due to browser
security restrictions that prevent cookie sharing across different domains
during upgrade requests.

**Solution Approach:**

Two reasonable approaches exist for WebSocket authentication[^ws-auth]:

- Credentials as the first WebSocket message (requires protocol modification)
- Credentials as query parameters (potential security risk through URL logging)

Kyber implements the first approach, using one-time authentication tokens passed
as the first WebSocket message. It was evaluated as the safest choice while not
drastically changing the WebSocket code.

#### Authentication Flow

The following sequence diagram illustrates the WebSocket authentication protocol:

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    
    Client->>Controller: POST /session/login with JWT
    Controller-->>Client: Session cookie + one-time WebSocket token
    
    Client->>Controller: WebSocket upgrade request
    create participant WebSocket
    Controller->>WebSocket: Create control plane connection
    Controller-->>Client: WebSocket connection established
    

    Client->>WebSocket: Send one-time token
    WebSocket->>WebSocket: Validate token
    
    alt Token valid
        WebSocket-->>Client: "Welcome" confirmation
        loop Active connection
            WebSocket->>Client: Heartbeat messages
        end
    else Token invalid
        WebSocket-xController: Terminate control plane
        WebSocket-->>Client: Connection closed
    end
```

## Data plane authentication

Kyber data plane authentication workflow follows the same principle as the control plane:

- the client initiate a connection with the controller on the data plane
- the client checks the server certificate validity and match during the connection establishment
- the client then sends a one-time token to the controller
- the controller checks the token and associate the new data plane connection to the user session

### General workflow

```mermaid
sequenceDiagram
    box transparent Data plane initialization (WebTransport)
    participant client
    participant controller
    end
    rect rgba(0, 0, 255, .1)
        Note over client, controller: HTTPS
        client->>controller: Control plane authentication process
        Note left of client: the client owns a valid session_cookie
        client->>+controller: /start_mux (with session_cookie)
        controller->>-client: (data_plane_address, data_plane_port, data_plane_token, data_plane_certificate_hash)
    end
    rect rgba(0, 255, 0, .1)
        Note over client, controller: WebTransport
        client->>+controller: init QUIC/WebTransport connection
        client->>client: checks server certificate (with data_plane_certificate_hash)
        controller->>-client: end TLS handshake
        Note left of client: the WebTransport server is now<br> authenticated by the client,<br>the WebTransport connection is<br>trusted by the client
        client->>+controller: sends data_plane_token (first message)
        controller->>controller: checks data_plane_token
        Note right of controller: the client is now<br>authenticated by the controller,<br>the WebTransport connection is<br>trusted by the controller<br>and the controller associates the<br>connection to the client's user session
    end
```

### Server certificate verification

There is no common standard on the QUIC and WebTransport way to verify the server's certificate authority and content validity.

Kyber uses a simple way to validate the controller's data plane:

- when asking for the data plane connection establishment, the controller provides the exact certificate hash used to establish the TLS connection on the data plane. This information is provided through the already established (secured and trusted) control plane, as a parameter to the /start_mux action.
- The client checks the data plane TLS establishment is done exclusively by the server with the given exact certificate hash.

The client check is done differently based on the implementation and the protocol used for the data plane establishment (QUIC or WebTransport), but the principle remains the same.

#### WebTransport

When using the WebTransport protocol (web client), the client always inits the WebTransport connection with the `serverCertificateHashes`[^serverCertificateHashes] parameter, with the given certificate hash provided by the /start_mux action on the control plane

#### QUIC

When using the QUIC protocol (native client), the client always checks the server's certificate used for TLS connection establishment has the exact same hash as the one provided by the /start_mux action on the control plane, either during of after the QUIC connection establishment.

[^auth-header]: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Authorization>
[^basic-auth-rfc]: <https://datatracker.ietf.org/doc/html/rfc7617>
[^bearer-auth-rfc]: <https://datatracker.ietf.org/doc/html/rfc6750>
[^uuid]: <https://en.wikipedia.org/wiki/Universally_unique_identifier>
[^actix-session]: <https://crates.io/crates/actix-session>
[^actix-identity]: <https://crates.io/crates/actix-identity>
[^ws-auth]: <https://websockets.readthedocs.io/en/stable/topics/authentication.html>
[^serverCertificateHashes]: https://developer.mozilla.org/en-US/docs/Web/API/WebTransport/WebTransport#servercertificatehashes