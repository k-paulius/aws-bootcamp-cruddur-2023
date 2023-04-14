# Week 1 — App Containerization

## Required Homework

- [Backend app Dockerfile](../backend-flask/Dockerfile)
- [Frontend app Dockerfile](../frontend-react-js/Dockerfile)

## Homework Challenges

### Git Commit Signing Using YubiKey Backed PGP/SSH Keys

The information about the author that is linked to a Git commit is determined by the `user.name` and `user.email` settings in the Git configuration. These settings can be set to any value, and are not verified by Git or GitHub. As a result, anyone with the ability to write to the GitHub repository can impersonate any commit author.
To improve the integrity of the data and to ensure that the commit is actually authored by the specified individual, Git provides the ability to sign commits using GPG, SSH, or S/MIME. This process adds an extra layer of security and assurance.

#### Commit Signing Using GPG

To setup commit signing using GPG:
- Generate personal PGP keys and store private keys on the YubiKey
    - follow this excellent step-by-step guide to accomplish that: [drduh/YubiKey-Guide: Guide to using YubiKey for GPG and SSH](https://github.com/drduh/YubiKey-Guide)
    - additional Yubico documentation: [PGP | dev.yubico](https://developers.yubico.com/PGP/)
- Configure Git:
    ```bash
    # tell Git which PGP key to use
    git config --global user.signingkey AABBCCDD

    # force Git to sign all commit
    git config --global commit.gpgsign true
    # or just local repo
    git config --local commit.gpgsign true
    # or use -S flag to sign individual commits if you are not forcing global/local commit signing
    git commit -S -m "YOUR_COMMIT_MESSAGE"
    ```
- Add your public PGP key to GitHub
    - [Adding a GPG key to your GitHub account | GitHub Docs](https://docs.github.com/en/authentication/managing-commit-signature-verification/adding-a-gpg-key-to-your-github-account)

#### Agent Forwarding

Git commits can be signed using GPG key on any Windows/Linux/Mac machine where the YubiKey is physically plugged in. In order to sign commits on a remote machine we can forward `gpg-agent` to a remote system over SSH. Following guides describe that process:
- [AgentForwarding | GnuPG wiki](https://wiki.gnupg.org/AgentForwarding)
- [Forwarding gpg-agent and ssh-agent to remote - GnuPG | ArchWiki](https://wiki.archlinux.org/title/GnuPG#Forwarding_gpg-agent_and_ssh-agent_to_remote)

Unfortunately, Win32-OpenSSH, the native OpenSSH implementation for Windows, does not support `gpg-agent` forwarding at present, as stated in a bug report: [Fail to RemoteForward a unix domain socket · Issue #1564 | PowerShell/Win32-OpenSSH](https://github.com/PowerShell/Win32-OpenSSH/issues/1564). However `ssh-agent` forwarding is possible and GPG also supports SSH. As a workaround, `ssh-agent` can be substituted with `gpg-agent` (it supports `ssh-agent` emulation), and `ssh-agent` can be forwarded, allowing the use of Git commit signing with SSH key on remote systems.

- Export public SSH key from GPG:
    - ```gpg --output pgp-ssh-key.pub --export-ssh-key <KEY ID>```
- Configure Git on the remote machine:
    ```bash
    # tell Git to use SSH key for signing
    git config --global gpg.format ssh
    # tell Git which key to use; copy public SSH key to the specified file on the remote system
    git config --global user.signingkey "$HOME/.ssh/pgp-ssh-key.pub"

    # force Git to sign all commit
    git config --global commit.gpgsign true
    # or just local repo
    git config --local commit.gpgsign true
    # or use -S flag to sign individual commits if you are not forcing global/local commit signing
    git commit -S -m "YOUR_COMMIT_MESSAGE"

    # configure allowedSignersFile that lists trusted SSH keys for signature verification
    git config --global gpg.ssh.allowedSignersFile "$HOME/.ssh/allowed_signers"
    cat ~/.ssh/allowed_signers
    # user@example.com sk-ssh-ed25519 AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29tAAAAIJhUXYvdwz3Dx4ABC123Hs1R21mlUm0o63+s4iCzRoFeAAAACnNzaDpnaABC123=
    ```
    - see [Securing git with SSH and FIDO2](https://developers.yubico.com/SSH/Securing_git_with_SSH_and_FIDO2.html) for more details

- Add your public SSH key to GitHub. This is needed for GitHub to show "Verified" status for the SSH signed commits.
    - [Adding a new SSH key to your GitHub account - GitHub Docs](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)
- Replace `ssh-agent` with `gpg-agent`:
    - Configure `gpg-agent` to support SSH by adding below to `c:\Users\<user>\AppData\Roaming\gnupg\gpg-agent.conf`
        ```
        enable-ssh-support
        enable-win32-openssh-support
        ```
    - stop 'OpenSSH Authentication Agent' service and change start up type to manual
        ```Powershell
        Get-Service -Name ssh-agent | Stop-Service
        Set-Service -Name ssh-agent -StartupType Manual
        ```
    - Start the `gpg-connect-agent`
        - this step needs to be performed after every reboot/login, unless you add it to auto-startup
        ```bash
        gpg-connect-agent /bye
        ```
    - Point `SSH_AUTH_SOCK` environment variable to `gpg-agent` socket
        ```Powershell
        [Environment]::SetEnvironmentVariable('SSH_AUTH_SOCK', '\\.\pipe\openssh-ssh-agent', 'User')
        ```
    - Check to make sure SSH can access your GPG SSH key:
        ```bash
        ssh-add -l
        # should output:
        # 256 SHA256:KEYIDABC123 cardno:11_123_789 (ED25519)
        ```
    - additional info: [SSH Authentication to GitHub Using a YubiKey on Windows | dev.yubico](https://developers.yubico.com/PGP/SSH_authentication/Windows.html)
- Forward `ssh-agent` when accessing remote system
    - ***WARNING:*** SSH Agent forwarding exposes your authentication to the server you're connection to. Root or anyone else that can access `SSH_AUTH_SOCK` socket on the remote system will be able to communicate with your SSH agent on the local machine and authenticate as you. To mitigate this when using YubiKey make sure you have it setup to require a presence verification (touch of the security key before auth is approved.)
    - to forward `ssh-agent` add -A flag when connecting to the remote system
    ```bash
    ssh -A user@ssh.mozilla.com
    ```

#### Git Commit Signing on Gitpod

Gitpod does not support "native" Git commit signing when using their browser interface, but we can use `ssh-agent` forwarding method with desktop clients such as VSCode as well as direct access via SSH. Follow steps from this blog post to set it up: [Signing Commits on Gitpod with 1Password | Gitpod](https://www.gitpod.io/blog/signing-git-commits-on-gitpod-with-1-password)