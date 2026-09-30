# Accuracy and utility review

Reviewed September 30, 2026. Scope: the ten reference pages, the single-file browser experience, and the README.

The offline, single-file format is useful for quick lookup and recovery environments. The largest content problems were obsolete Parted commands, incomplete rsync directory examples, mixed editor keybinding contexts, and personal assumptions in the NixOS and Kate drafts. Those sections now identify command context and configuration prerequisites explicitly.

## Content changes

| Page | Corrections and improvements |
| --- | --- |
| Pacman | Replaced download-only live database refresh with `checkupdates -d`; explained partial-upgrade risks, configuration removal, optional pacman-contrib tools, and reviewing orphan packages before removal. |
| Parted | Removed obsolete `move`, `cp`, and `check` examples. Added explicit units, GPT partition names, alignment checks, immediate-write warnings, and separate Parted/shell steps. Clarified that partition creation and boundary resizing do not create or resize a filesystem. |
| Git | Corrected staging scope and stash exclusions; added staged review, unstaging, branch creation, fetch, fast-forward pulls, reflog, and revert. Replaced standalone pruning with practical recovery guidance. |
| Homebrew | Corrected `cleanup -s` exclusions; added cleanup preview and clarified update versus upgrade, macOS casks, and service registration. |
| Unix/Linux | Fixed rsync recursion, bandwidth units, partial-transfer wording, and deletion previews. Replaced slash-separated tool alternatives with usable commands. Clarified permissions, adjacent-line counting, sed backups, filesystem inspection, privileges, and Linux/systemd scope. |
| Debian/APT | Distinguished installed packages from residual dpkg states; clarified purge and dependency repair; added service privileges and explained that enable does not start a service. |
| Tmux | Separated vi and Emacs copy-mode tables, corrected selection/copy keys and pane split descriptions, added session startup/reattachment and configuration commands. Removed unqualified mouse behavior assumptions. |
| Editors | Labelled editor/mode-specific motions, corrected Emacs/Micro editing distinctions and Micro help, explained commenting-plugin requirements and substitution scope, and added Vim exit/recovery and Emacs undo/redo essentials. |
| NixOS/Nix | Removed personal host/repository assumptions. Distinguished flakes, classic configuration, persistent profiles, temporary shells, system generations, and Home Manager integration. Fixed preview commands and the system attribute in a dev-shell fragment. Replaced “silence means success” with exit-status guidance and explained rollback/cleanup limits. |
| Engram/Kate | Identified the Engram-en version and character-pair notation. Marked Kate mappings as suggestions and described plugin/language-server requirements. Removed inconsistent compressed bindings, unsupported frequency/speed claims, and fixed training deadlines. |

## Browser changes

- Added multiword, case-insensitive card search across all pages, tab counts, clearing, and an empty state.
- Added semantic headings, accessible tab selection, arrow/Home/End navigation, visible focus, page bookmarks, and Back/Forward support.
- Copying preserves hidden-tab content and multiline whitespace, avoids inline prose/keybindings, and does not report success when the legacy clipboard API returns false. A manual-copy dialog handles denial or unsupported copying.
- Improved mobile spacing and heading wrapping, darkened gradients for readable white labels, respected reduced motion, and added selected-page printing.
- All reference pages remain visible when JavaScript is disabled. No network requests are needed for the local app; references require a connection.
- Updated setup/use instructions and the screenshot while keeping the application self-contained.

## Sources

Official documentation and upstream references consulted for corrections; links are also included in the app:

- [Arch system maintenance](https://wiki.archlinux.org/title/System_maintenance) and [pacman manual](https://man.archlinux.org/man/pacman.8.en)
- [GNU Parted manual](https://www.gnu.org/software/parted/manual/parted.html)
- [Git command reference](https://git-scm.com/docs), including [git-add](https://git-scm.com/docs/git-add) and [git-prune](https://git-scm.com/docs/git-prune)
- [Homebrew manual](https://docs.brew.sh/Manpage)
- [Rsync manual](https://download.samba.org/pub/rsync/rsync.1)
- [Debian APT manual](https://manpages.debian.org/trixie/apt/apt.8.en.html)
- [tmux upstream manual](https://github.com/tmux/tmux/blob/master/tmux.1)
- [GNU Emacs manual](https://www.gnu.org/software/emacs/manual/html_node/emacs/), [Vim help](https://vimhelp.org/), [Micro bindings](https://github.com/zyedidia/micro/blob/master/runtime/help/keybindings.md), and [GNU nano manual](https://www.nano-editor.org/dist/latest/nano.html)
- [NixOS manual](https://nixos.org/manual/nixos/stable/), [nixos-rebuild reference](https://wiki.nixos.org/wiki/Nixos-rebuild), [Nix profile add](https://nix.dev/manual/nix/2.34/command-ref/new-cli/nix3-profile-add), [flake check](https://nix.dev/manual/nix/2.34/command-ref/new-cli/nix3-flake-check), [store gc](https://nix.dev/manual/nix/2.34/command-ref/new-cli/nix3-store-gc), and [garbage collection](https://nix.dev/manual/nix/2.34/command-ref/nix-collect-garbage)
- [Home Manager documentation](https://home-manager.dev/)
- [Engram upstream layout/version history](https://github.com/binarybottle/engram) and [Kate LSP documentation](https://docs.kde.org/trunk_kf6/en/kate/kate/kate-application-plugin-lspclient.html)

## Verification and limits

The development regression suite opens the actual local HTML in Chromium/Edge and checks all ten pages at 320, 390, 768, 900, and 1280 pixels. It verifies search and layout restoration, URL/history navigation, tab accessibility, exact text for all 262 copy buttons, successful and rejected clipboard paths, print visibility, reduced motion, label contrast, unique IDs, offline requests, and no-JavaScript readability. Desktop and mobile screenshots were inspected.

Command accuracy was reviewed against documentation. The Linux/macOS package, disk, editor, and Nix examples were not executed against live systems; destructive commands were not run. Browser testing covers Chromium/Edge, not every browser engine. Local clipboard support, editor bindings, and tool interfaces can vary by browser, version, terminal, and configuration. This is a lookup reference, not a complete installation guide or a guarantee that every command fits a particular machine.
