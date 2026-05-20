# Windows-specific integration — design notes (internal)

This document explains why we ship a custom Windows Service (`service.exe`) and how it cooperates with the per-session process (`controller.exe`) to provide startup, logon/UAC access, and secure-desktop capture/injection behavior.

## Summary

- `service.exe` is a custom Windows Service that starts with the system and runs in **Session 0** as the **LOCAL_SYSTEM** account. It survives user logons/logouts and tracks session changes.
- `controller.exe` is a per-session process that actually grabs the desktop and performs input injection. The service is responsible for launching `controller.exe` into the right interactive session and giving it the token/rights required to access special desktops (logon screen / UAC).
- A plain interactive launch of `controller.exe` (manually started by a user) can operate on the normal user desktop, but **cannot** capture or interact with the Secure Desktop (logon screen, UAC prompt). To handle those secure contexts reliably we must use the service to create the controller process with a modified security token (via `CreateProcessAsUser()` and token adjustments).

---

## Why a custom Windows Service is required

1. **Automatic start at system boot**
   Windows Services marked for automatic start are launched by the Service Control Manager (SCM) during system startup. This guarantees `service.exe` is present early, before any user logs on. That is a hard requirement if the product must be available at the logon screen or immediately after boot.

2. **Runs in Session 0 and survives user sessions**
   Since Windows Vista, services run in **Session 0** (Session 0 isolation). A service therefore is not tied to any single interactive user session and is not torn down when users log out. This is necessary because we need a long-running supervisor that can observe session creation/destruction and act when new interactive sessions appear.

3. **Privilege boundary and token manipulation**
   Running as a service (typically as the **LOCAL_SYSTEM** account) provides the ability to obtain and adjust tokens, perform actions on behalf of users, and call Windows APIs that are restricted for ordinary user processes. That capability is used to start `controller.exe` in other sessions with the required privileges.

---

## The `LOCAL_SYSTEM` account (brief)

- `LOCAL_SYSTEM` is a built-in high-privilege account used by services. It has extensive privileges on the local machine (often greater than an administrator account), and it can access system resources and manage sessions.
- Because `LOCAL_SYSTEM` can open and duplicate or impersonate other tokens and has rights the interactive user does not, the service running as `LOCAL_SYSTEM` can prepare a token suitable for `controller.exe` to access protected desktops.

---

## Windows sessions and desktops — isolation model

- **Session**: a logical isolation unit for user logons. Each logged-on interactive user gets a separate session. Services run in Session 0; interactive users get Session 1, 2, … (session numbers depend on system state).
  - When a user logs out, their session is torn down and a new session is created for the next interactive logon. Because each session is isolated, processes in one session normally cannot access UI objects in another session.
- **Desktop**: within a session, Windows supports multiple desktops (objects of type `HDESK`) — e.g. the default user desktop, the Winlogon (logon) desktop, and the Secure Desktop used by UAC.
  - The **default desktop** (e.g., `Default`) is where the regular user UI runs (explorer, apps).
  - The **Winlogon / Logon desktop** is used for the logon UI (Ctrl+Alt+Del and credentials).
  - The **Secure Desktop** is an isolated desktop that can be switched to for secure operations — most notably the UAC elevation prompt and the secure credential entry UI. The Secure Desktop is intentionally isolated from normal processes to prevent UI spoofing and input interception.

---

## Secure Desktop (logon screen, UAC) — protection model

- The Secure Desktop and logon desktop are intentionally isolated. Processes running on the normal interactive desktop cannot simply read or control UI on the Secure Desktop.
- This isolation is a security feature: it prevents ordinary processes (including malware) from capturing credentials or injecting input during elevation/logon.

---

## `IDXGIOutput1::DuplicateOutput()` limitation and secure desktop

- `IDXGIOutput1::DuplicateOutput()` (DXGI Desktop Duplication) allows a process to capture desktop frames, but **it operates within the context of a specific session and desktop**.
- If `DuplicateOutput()` is called from a normal interactive session/process (a process started by the logged-in user), it **cannot** capture frames that are displayed on the Secure Desktop or the Winlogon/logon desktop because those are different desktops and are protected.
- In order to capture the Secure Desktop (or otherwise interact with it), the capturing process must be launched with appropriate rights and in the context that allows access to that desktop. That is why simply running `controller.exe` as a normal user is insufficient.

---

## How the service + controller design addresses this

1. **Service starts at boot (Session 0, LOCAL_SYSTEM).**
2. **Spawns `controller.exe` in the interactive session.**
   The service obtains or constructs a token for the target session and then calls `CreateProcessAsUser()` to create `controller.exe` inside the interactive session.
   The spawned `controller.exe` thus runs in the interactive session but can carry elevated rights necessary for secure-desktop capture and input injection (to the extent allowed by Windows security policy).

3. **Controller tracks desktop switches and performs capture/injection.**
   `controller.exe` and its subprocesses are responsible for calling DXGI duplication APIs, hooking or capturing the correct desktop, and performing input injection on the active desktop. Because it was launched with the appropriate token by the service, it can access desktops the plain user process could not.

## Important behavioral points / limitations

- **Service-run controller vs manually-run controller**
  If `controller.exe` is launched manually from an interactive session (double-click, start menu, or run from the user account), it runs with the user's token and **cannot** capture or interact with the Secure Desktop (logon/UAC). It will be able to capture the normal user desktop (and typically Task Manager and other user-desktop windows) but **not** secure desktops or any desktops isolated by the system.
  Therefore manual starts are useful for debugging normal-desktop capture but cannot reproduce or provide logon/UAC behavior.

- **Capturing / controlling Task Manager**
  Task Manager runs in the interactive user desktop (unless the system is on the Secure Desktop). An instance of `controller.exe` launched in the interactive session can capture Task Manager's window content. However, control (input injection) into Task Manager or other protected UI elements may be restricted by Windows input isolation mechanisms. Behavior can vary depending on the token/privileges available to the process that attempts input injection.
  In short: manual controller → can capture user desktop and Task Manager visuals; cannot reliably control protected UI or access the Secure Desktop.

- **Secure Desktop capture requires correct session/desktop context + rights**
  Capturing Secure Desktop requires that the capturing process be able to access the desktop object where the secure UI is shown. The service+CreateProcessAsUser approach is the implemented way to get a `controller.exe` process into the right context with appropriate token adjustments.
