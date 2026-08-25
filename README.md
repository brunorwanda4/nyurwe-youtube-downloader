# YtGrab

YtGrab is a private Windows desktop app for saving video, audio, and playlists. It uses the existing `yt-dlp` project for extraction, FFmpeg for media conversion, and Deno for YouTube's JavaScript challenges. The interface is Next.js in `src/app`; Tauri and Rust provide the native download layer.

> Download only media you own or have permission to save. Site terms and local copyright laws still apply.

## What changed in 1.1

- All Next.js application code now lives in `src/app`.
- First-run setup downloads the official tools into YtGrab's private app-data folder; recipients do not need to use the terminal or install Python.
- **Update engine** refreshes yt-dlp to the current official nightly without re-downloading FFmpeg or Deno when they are already available.
- Current YouTube JavaScript challenge support is included through Deno.
- Download errors, cancellation, URL validation, folder creation, and tool detection are handled more reliably.
- The redesigned responsive interface is ready to hand to non-technical users.

## Develop

Requirements: Windows 10/11, Bun, Rust, and the Tauri v2 system prerequisites.

```powershell
bun install
bun run app
```

The first app launch shows **Set up now**. It downloads:

- the official Windows `yt-dlp` nightly executable;
- FFmpeg and FFprobe from `yt-dlp/FFmpeg-Builds`;
- the official Deno Windows executable.

Tools are kept in `%LOCALAPPDATA%\com.brunorwanda.ytgrab\tools`. If compatible versions are already on `PATH`, YtGrab uses those and skips the setup prompt.

## Build an installer to share

```powershell
bun run app:build
```

The distributable NSIS installer is written to:

```text
src-tauri\target\release\bundle\nsis\YtGrab_1.1.0_x64-setup.exe
```

Send that installer to users. On first use they need an internet connection for the one-time engine setup. Downloads run locally and are written directly to the folder they choose.

## Architecture notes

- `src/app/page.tsx` calls the existing Tauri commands and listens for progress events.
- `src-tauri/src/lib.rs` validates requests and launches `yt-dlp` as an argument-safe child process.
- The frontend never downloads or processes the media itself.
- Downloads run one at a time. Stop terminates the active process and keeps completed files.
- Playlists are placed in a folder named after the playlist and receive numbered filenames.

## Upstream projects

- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [yt-dlp FFmpeg builds](https://github.com/yt-dlp/FFmpeg-Builds)
- [Deno](https://github.com/denoland/deno)

YtGrab is not affiliated with YouTube or those upstream projects. The tools downloaded by first-run setup are governed by their own licenses.
