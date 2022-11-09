# Tailscale GitHub Action

> **Note**
> This is a reimagining of the official Tailscale [GitHub Action][2] that
> attempts to minimize the amount of set up for the action.

This GitHub Action connects to your [Tailscale network][2] by adding a step to
your workflow.

```yaml
- name: Tailscale
  uses: dhermes/tailscale-github-action@v1.32.2
  with:
    authkey: ${{ secrets.TAILSCALE_AUTHKEY }}
```

Subsequent steps in the Action can then access nodes in your Tailnet.

The `TAILSCALE_AUTHKEY` secret must be an [authkey][3] for the Tailnet to be
accessed, and needs to be populated in the Secrets for your workflow.
[Ephemeral authkeys][4] tend to be a good fit for GitHub runners, as they clean
up their state automatically shortly after the runner finishes.

## Binaries

The binaries were fetched from
`https://pkgs.tailscale.com/stable/tailscale_1.32.2_amd64.tgz` and
`https://pkgs.tailscale.com/stable/tailscale_1.32.2_arm64.tgz`

## Development and usage

This GitHub Action minimizes the amount of setup time required for the action
once it has been pulled by GitHub. To accomplish this we check in binaries
of the form `tailscale-linux-amd64-{VERSION}` and
`tailscaled-linux-amd64-{VERSION}` so that they are ready to use immediately.
Then as an entrypoint we use a Node.js script to determine the correct OS
and architecture.

In order to avoid having a large (and bloated) `main` branch, each release is a
dedicated branch with minimal history and contains only the `tailscale-*` and
`tailscaled-*` binary needed for that version.

[1]: https://github.com/tailscale/github-action
[2]: https://tailscale.com
[3]: https://tailscale.com/kb/1085/auth-keys/
[4]: https://tailscale.com/kb/1111/ephemeral-nodes/
