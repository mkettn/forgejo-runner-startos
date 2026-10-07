<p align="center">
  <img src="icon.svg" alt="Forgejo Runner Logo" width="21%">
</p>

# Forgejo Runner on StartOS

> Everything not listed in this document should behave the same as upstream
> Forgejo Runner. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Forgejo Runner](https://code.forgejo.org/forgejo/runner) executes Forgejo Actions workflows. This package runs it against a Forgejo instance you provide, with a rootless Podman engine inside the service so each job gets its own container.

- **Upstream repo:** <https://code.forgejo.org/forgejo/runner>
- **Wrapper repo:** <https://github.com/Start9Labs/forgejo-runner-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The image is built here: upstream's runner binary is copied onto a Debian base carrying a rootless container engine, because the runner needs somewhere to run each job.

| Property      | Value                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Image         | Built from `Dockerfile` — upstream's `forgejo-runner` binary plus Podman |
| Architectures | x86_64, aarch64                                                          |
| Command       | The repo's `entrypoint.sh`, run as the unprivileged `app` user           |
| Subcontainer  | `forgejo-runner-sub` — the `primary` daemon, and the one to `attach` to  |

The manifest declares two device grants that this arrangement requires: **userspace filesystems** for the storage driver, and **virtual networking** for job networking. Without either, the nested engine cannot start a job container. The image also carries `git`, because the runner fetches `uses:` actions with the git CLI and every such step fails without it.

Three oneshots run as root before the daemon. `own-data` creates the runner's working directory on the volume and hands it to `app`, leaving the rest of the volume alone. `device-perms` re-opens `/dev/net/tun` and `/dev/fuse` to mode 0666: StartOS 0.4.0.1 and earlier can create those granted nodes root-only, and the engine opens both as the unprivileged user. It is idempotent and becomes a no-op once the OS-side fix ships. `clean-runtime` removes the engine's runtime directory. `XDG_RUNTIME_DIR` sits on the persistent volume, so the boot ID podman caches there survives a reboot and podman refuses to start against it. It runs after `own-data` rather than beside it, so the two never walk the same tree at once, and it removes no durable state: the entrypoint recreates the directory on every start, and the image layer store is a sibling that is left alone.

## Volume and Data Layout

One volume, shared between the package's state and the runner's working area.

| Volume | Mount Point | Purpose                                                              |
| ------ | ----------- | -------------------------------------------------------------------- |
| `main` | `/data`     | `store.json`, and the runner's own working directory under `runner/` |

## File Models

Two models: the runner's registration and job configuration, and a marker the entrypoint leaves when Forgejo rejects those credentials.

| File                   | Format | Modelled                  | Written by                                         |
| ---------------------- | ------ | ------------------------- | -------------------------------------------------- |
| `store.json`           | JSON   | Yes — `FileHelper.json`   | Every init, and the Configure action               |
| `runner/rejected-uuid` | Text   | Yes — `FileHelper.string` | `entrypoint.sh`, when Forgejo rejects `runnerUuid` |

| Key                         | Notes                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `runnerUuid`, `runnerToken` | The credentials Forgejo shows when you create a runner. Both present is what counts as configured |
| `labels`                    | Comma-separated, in the runner's own `name:docker://image` or `name:host` syntax                  |
| `capacity`                  | How many jobs run at once                                                                         |
| `emulation`                 | Whether to also advertise the other CPU architecture                                              |

`store.json`'s model **strips keys it does not declare**, and nothing else writes the file. Everything reaches the runner as environment on each start, so there is no configuration file on disk to inspect or correct.

`USER` is set to the unprivileged account the daemon runs as, not left at the container's inherited `root`. The container engine resolves its subordinate UID and GID ranges by `$USER`, and finding none for `root` it falls back to a single-ID mapping — under which any job image carrying a file not owned by root fails to unpack.

The one value the package composes rather than passes through is the label list. With emulation enabled it appends a foreign-architecture label pinned to that platform, so jobs targeting the other architecture are served under the host's emulation layer. The runner process itself always runs natively.

## Dependencies

None. The runner connects to whichever Forgejo instance you enter as `instanceUrl` in Configure — defaulting to `http://forgejo.startos:3000`, the Forgejo package's HTTP port on its StartOS hostname (assumed to resolve from this service; not verified on a device) — or any other. A store with no URL (including existing installs) reads as that default, so same-device users need no change. For other instances prefer a plain-HTTP or publicly trusted HTTPS address: a self-signed certificate, as on a `.local` or Tor address, is not trusted by job containers. Forgejo Actions must be enabled on that instance; this package cannot enforce that.

If the instance is unreachable, the runner daemon fails to connect and the Runner health check reports it; nothing is resolved or gated by StartOS.

## Network Access and Interfaces

None. The runner dials out to its forge and pulls job images; it accepts no inbound connections and exports nothing.

## Installation and First-Run Flow

Install seeds the store with defaults and nothing else. There is no task, and the service starts — but it will not do any work until you connect it.

Two gates apply before that, both enforced rather than advisory:

1. **Hardware.** `main` refuses to start on a device below 2 CPU cores or roughly a 4 GB machine's worth of memory, because every job is a full build. The message says so explicitly rather than failing obscurely later.
2. **Forgejo.** Your instance must be reachable from this device.

Then run [Configure](#actions) with your Forgejo's URL and the UUID and token it shows under **Settings → Actions → Runners → Create new Runner**, and restart. Until then the runner's health check reports a failure telling you to do exactly that. The URL defaults to the Forgejo on this device; change it only for another instance.

## Actions

One action.

### Configure

Connects the runner to Forgejo and sets how it advertises itself.

- **What it changes:** every field in `store.json` — the Forgejo URL (trailing slashes stripped), the credentials, labels, concurrency, and the emulation toggle.
- **Cost:** the write is instant, but **it does not apply until the service restarts.** The action says so in its result rather than restarting for you.
- **Repeat safety:** idempotent; the form is pre-filled with the current values and replaces them wholesale.
- **Input notes:** labels use the runner's own syntax. Do not add architecture labels by hand for foreign-architecture jobs — the emulation toggle exists to append the correct pinned label, and a hand-written one will not carry the platform pin.

## Tasks

None. The service is never held on a prompt and its ordinary controls are always available.

## Health Checks

One check, on the `primary` daemon.

| Check              | Method                                                                                                          | Grace Period |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | ------------ |
| `primary` "Runner" | URL and credentials set and not rejected by Forgejo, then the runner process alive and the Podman API answering | 60 seconds   |

Without a URL and credentials it fails and names the action to run. It fails the same way while `runner/rejected-uuid` holds the configured UUID: the entrypoint writes it when Forgejo answers `unregistered runner` (its database no longer holds that runner, as after Forgejo is reinstalled), then idles instead of exiting, so the service waits for new credentials rather than restarting in a loop. Saving a different UUID clears it on the next start. With valid credentials it runs a script in the service container every 30 seconds: a `forgejo-runner` process must appear in `/proc`, and `podman --remote info` must succeed against the API socket the runner drives. Both have to hold — the runner exits when the engine is unreachable, and an engine with no runner behind it serves nothing. Whether Forgejo is currently handing it jobs is visible in Forgejo, not here.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. No dump step and nothing excluded.

- **Included:** the runner's credentials and configuration, and its working directory.
- **Restore:** the runner comes back configured against the same UUID and token. Whether Forgejo still recognises them depends on Forgejo's own state, which is that package's backup rather than this one's — if the forge was rebuilt, register the runner again.

## Limitations and Differences

1. **You supply the Forgejo URL.** The default assumes the Forgejo package on this device; there is no other discovery, and no check that Actions is enabled there.
2. **Configuration applies on restart**, not immediately.
3. **The service refuses to start on small hardware** — under 2 cores or roughly a 4 GB machine.
4. **Emulated jobs are much slower than native.** The toggle exists for occasional cross-architecture work; a native runner per architecture is the better arrangement for regular builds.
5. **Jobs run in a rootless engine inside the service**, which requires the two device grants named above, and on StartOS 0.4.0.1 and earlier a startup step to make those device nodes readable by the unprivileged user.
6. **No riscv64 build.** x86_64 and aarch64 only.

---

## Quick Reference for AI Consumers

```yaml
package_id: forgejo-runner
image: ./Dockerfile # upstream's runner binary plus rootless Podman on Debian
architectures:
  - x86_64
  - aarch64
subcontainers:
  - forgejo-runner-sub
volumes:
  main: /data
file_models:
  - store.json
startos_managed_env_vars:
  - INSTANCE_URL # from store.json instanceUrl
  - RUNNER_UUID
  - RUNNER_TOKEN
  - RUNNER_LABELS
  - RUNNER_CAPACITY
  - XDG_RUNTIME_DIR
  - USER
dependencies: []
interfaces: {} # none; the runner accepts no inbound connections
actions:
  - configure
tasks: []
health_checks:
  - primary # displayed "Runner"; credentials, then runner + engine liveness
```
