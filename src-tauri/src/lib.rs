use std::fs::{self, File};
use std::io::{BufRead, BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

const YTDLP_URL: &str =
    "https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp.exe";
const FFMPEG_URL: &str =
    "https://github.com/yt-dlp/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip";
const DENO_URL: &str =
    "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip";

/// Machine-readable progress line. Keep this in sync with `emit_line`.
const PROGRESS_TEMPLATE: &str = "download:@@%(progress._percent_str)s@@%(info.title)s";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Progress {
    kind: &'static str,
    text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    percent: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    index: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    total: Option<u32>,
}

impl Progress {
    fn line(text: impl Into<String>) -> Self {
        Self {
            kind: "line",
            text: text.into(),
            percent: None,
            index: None,
            total: None,
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct SetupProgress {
    text: String,
}

#[derive(Serialize)]
struct Tools {
    ytdlp: Option<String>,
    ffmpeg: Option<String>,
    deno: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MediaInfo {
    title: String,
    channel: String,
    duration: u64,
    thumbnail: String,
    is_playlist: bool,
    available_heights: Vec<u32>,
}

#[derive(Default)]
pub struct Running {
    child: Arc<Mutex<Option<Child>>>,
    cancelled: Arc<AtomicBool>,
}

fn base_command(program: &str) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

fn executable_name(program: &str) -> String {
    if cfg!(windows) {
        format!("{program}.exe")
    } else {
        program.to_string()
    }
}

fn tools_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_local_data_dir()
        .map(|path| path.join("tools"))
        .map_err(|error| format!("Could not find the app data folder: {error}"))
}

/// Prefer YtGrab-managed tools, then anything the user already has installed.
fn resolve(app: &AppHandle, program: &str) -> Option<String> {
    if let Ok(directory) = tools_dir(app) {
        let managed = directory.join(executable_name(program));
        if managed.is_file() {
            return Some(managed.to_string_lossy().into_owned());
        }
    }

    let version_arg = if program == "ffmpeg" {
        "-version"
    } else {
        "--version"
    };
    if base_command(program)
        .arg(version_arg)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .is_ok_and(|status| status.success())
    {
        return Some(program.to_string());
    }

    // winget shims may not reach an app that was open while the tool was installed.
    let shim = std::env::var_os("LOCALAPPDATA")
        .map(PathBuf::from)?
        .join("Microsoft")
        .join("WinGet")
        .join("Links")
        .join(executable_name(program));
    shim.is_file().then(|| shim.to_string_lossy().into_owned())
}

fn version_of(app: &AppHandle, program: &str) -> Option<String> {
    let path = resolve(app, program)?;
    let version_arg = if program == "ffmpeg" {
        "-version"
    } else {
        "--version"
    };
    let output = base_command(&path).arg(version_arg).output().ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    stdout
        .lines()
        .chain(stderr.lines())
        .find(|line| !line.trim().is_empty())
        .map(|line| line.trim().to_string())
        .or_else(|| Some("installed".to_string()))
}

fn tool_status(app: &AppHandle) -> Tools {
    Tools {
        ytdlp: version_of(app, "yt-dlp"),
        ffmpeg: version_of(app, "ffmpeg"),
        deno: version_of(app, "deno"),
    }
}

#[tauri::command]
fn check_tools(app: AppHandle) -> Tools {
    tool_status(&app)
}

#[tauri::command]
fn default_folder(app: AppHandle) -> String {
    app.path()
        .download_dir()
        .or_else(|_| app.path().video_dir())
        .map(|path| path.to_string_lossy().into_owned())
        .unwrap_or_default()
}

fn emit_setup(app: &AppHandle, text: impl Into<String>) {
    let _ = app.emit("setup-progress", SetupProgress { text: text.into() });
}

fn download_file(
    client: &reqwest::blocking::Client,
    app: &AppHandle,
    url: &str,
    destination: &Path,
    label: &str,
) -> Result<(), String> {
    emit_setup(app, format!("Downloading {label}…"));
    let mut response = client
        .get(url)
        .send()
        .and_then(|response| response.error_for_status())
        .map_err(|error| format!("Could not download {label}: {error}"))?;
    let expected = response.content_length();
    let mut file = File::create(destination)
        .map_err(|error| format!("Could not create the {label} file: {error}"))?;
    let mut buffer = [0_u8; 64 * 1024];
    let mut received = 0_u64;
    let mut last_reported = 0_u64;

    loop {
        let count = response
            .read(&mut buffer)
            .map_err(|error| format!("The {label} download was interrupted: {error}"))?;
        if count == 0 {
            break;
        }
        file.write_all(&buffer[..count])
            .map_err(|error| format!("Could not save {label}: {error}"))?;
        received += count as u64;
        if let Some(total) = expected {
            let percent = received.saturating_mul(100) / total.max(1);
            let milestone = (percent / 10) * 10;
            if milestone >= last_reported + 10 {
                last_reported = milestone;
                emit_setup(app, format!("Downloading {label}… {milestone}%"));
            }
        }
    }
    Ok(())
}

fn extract_from_zip(archive_path: &Path, suffix: &str, destination: &Path) -> Result<(), String> {
    let file = File::open(archive_path).map_err(|error| error.to_string())?;
    let mut archive =
        zip::ZipArchive::new(file).map_err(|error| format!("Invalid tool archive: {error}"))?;
    let index = (0..archive.len())
        .find(|index| {
            archive
                .by_index(*index)
                .map(|entry| entry.name().replace('\\', "/").ends_with(suffix))
                .unwrap_or(false)
        })
        .ok_or_else(|| format!("{suffix} was not found in the downloaded archive."))?;
    let mut source = archive.by_index(index).map_err(|error| error.to_string())?;
    let mut output = File::create(destination).map_err(|error| error.to_string())?;
    std::io::copy(&mut source, &mut output).map_err(|error| error.to_string())?;
    Ok(())
}

fn replace_download(source: &Path, destination: &Path) -> Result<(), String> {
    if destination.is_file() {
        fs::remove_file(destination)
            .map_err(|error| format!("Could not replace {}: {error}", destination.display()))?;
    }
    fs::rename(source, destination)
        .map_err(|error| format!("Could not install {}: {error}", destination.display()))
}

fn install_tools(app: &AppHandle) -> Result<Tools, String> {
    if !cfg!(all(windows, target_arch = "x86_64")) {
        return Err("Automatic setup is currently available for 64-bit Windows only.".into());
    }

    let directory = tools_dir(app)?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Could not create the tools folder: {error}"))?;
    let client = reqwest::blocking::Client::builder()
        .user_agent("YtGrab/1.1")
        .build()
        .map_err(|error| error.to_string())?;

    let ytdlp_download = directory.join("yt-dlp.download");
    let ffmpeg_archive = directory.join("ffmpeg.download.zip");
    let deno_archive = directory.join("deno.download.zip");
    let needs_ffmpeg = resolve(app, "ffmpeg").is_none();
    let needs_deno = resolve(app, "deno").is_none();

    let result = (|| {
        // Always refresh yt-dlp. Extractor fixes are released frequently as
        // video sites change, while FFmpeg and Deno only need installing once.
        download_file(&client, app, YTDLP_URL, &ytdlp_download, "yt-dlp")?;
        replace_download(&ytdlp_download, &directory.join("yt-dlp.exe"))?;

        if needs_ffmpeg {
            download_file(&client, app, FFMPEG_URL, &ffmpeg_archive, "FFmpeg")?;
            emit_setup(app, "Unpacking FFmpeg…");
            extract_from_zip(
                &ffmpeg_archive,
                "/bin/ffmpeg.exe",
                &directory.join("ffmpeg.exe"),
            )?;
            extract_from_zip(
                &ffmpeg_archive,
                "/bin/ffprobe.exe",
                &directory.join("ffprobe.exe"),
            )?;
        }

        if needs_deno {
            download_file(&client, app, DENO_URL, &deno_archive, "the YouTube engine")?;
            emit_setup(app, "Unpacking the YouTube engine…");
            extract_from_zip(&deno_archive, "deno.exe", &directory.join("deno.exe"))?;
        }
        Ok::<(), String>(())
    })();

    // Archive cleanup is best-effort and scoped to the three setup temp files.
    let _ = fs::remove_file(&ytdlp_download);
    let _ = fs::remove_file(&ffmpeg_archive);
    let _ = fs::remove_file(&deno_archive);
    result?;

    emit_setup(app, "Download engine is ready.");
    let status = tool_status(app);
    if status.ytdlp.is_none() || status.ffmpeg.is_none() || status.deno.is_none() {
        return Err("Setup finished, but one of the download tools could not start.".into());
    }
    Ok(status)
}

#[tauri::command]
async fn setup_tools(app: AppHandle) -> Result<Tools, String> {
    tauri::async_runtime::spawn_blocking(move || install_tools(&app))
        .await
        .map_err(|error| format!("Setup task failed: {error}"))?
}

fn emit_line(app: &AppHandle, raw: &str) {
    let line = raw.trim_end();
    if line.is_empty() {
        return;
    }
    if let Some(rest) = line.strip_prefix("@@") {
        let (percent, title) = rest.split_once("@@").unwrap_or((rest, ""));
        let value = percent
            .trim()
            .trim_end_matches('%')
            .parse::<f64>()
            .unwrap_or(0.0);
        let _ = app.emit(
            "progress",
            Progress {
                kind: "percent",
                text: title.trim().to_string(),
                percent: Some(value),
                index: None,
                total: None,
            },
        );
        return;
    }
    if let Some(rest) = line.strip_prefix("[download] Downloading item ") {
        let mut parts = rest.split(" of ");
        let index = parts
            .next()
            .and_then(|value| value.trim().parse::<u32>().ok());
        let total = parts
            .next()
            .and_then(|value| value.trim().parse::<u32>().ok());
        if let (Some(index), Some(total)) = (index, total) {
            let _ = app.emit(
                "progress",
                Progress {
                    kind: "item",
                    text: line.to_string(),
                    percent: None,
                    index: Some(index),
                    total: Some(total),
                },
            );
            return;
        }
    }
    let _ = app.emit("progress", Progress::line(line));
}

fn inspect_url_sync(app: &AppHandle, url: &str) -> Result<MediaInfo, String> {
    let parsed = reqwest::Url::parse(url).map_err(|_| "Paste a valid YouTube link.")?;
    if !matches!(parsed.scheme(), "http" | "https") || parsed.host_str().is_none() {
        return Err("Only http and https links can be inspected.".into());
    }

    let ytdlp =
        resolve(app, "yt-dlp").ok_or("Set up the download engine before reading video details.")?;
    let output = base_command(&ytdlp)
        .args([
            "--ignore-config",
            "--dump-single-json",
            "--no-warnings",
            "--no-playlist",
            "--",
        ])
        .arg(url)
        .output()
        .map_err(|error| format!("Could not read this link: {error}"))?;
    if !output.status.success() {
        let message = String::from_utf8_lossy(&output.stderr);
        return Err(message
            .lines()
            .find(|line| !line.trim().is_empty())
            .unwrap_or("Could not read this YouTube link.")
            .to_string());
    }

    let value: serde_json::Value = serde_json::from_slice(&output.stdout)
        .map_err(|_| "The download engine returned unreadable video details.".to_string())?;
    let mut heights: Vec<u32> = value
        .get("formats")
        .and_then(|formats| formats.as_array())
        .into_iter()
        .flatten()
        .filter_map(|format| {
            format
                .get("height")
                .and_then(|height| height.as_u64())
                .map(|height| height as u32)
        })
        .collect();
    heights.sort_unstable();
    heights.dedup();
    let canonical = [240_u32, 360, 480, 720, 1080];
    let available_heights = canonical
        .into_iter()
        .filter(|height| heights.iter().any(|found| found >= height))
        .collect();
    let is_playlist = parsed
        .query_pairs()
        .any(|(key, value)| key == "list" && !value.is_empty())
        || parsed.path().contains("playlist");

    Ok(MediaInfo {
        title: value
            .get("title")
            .and_then(|item| item.as_str())
            .unwrap_or("Untitled video")
            .to_string(),
        channel: value
            .get("channel")
            .or_else(|| value.get("uploader"))
            .and_then(|item| item.as_str())
            .unwrap_or("YouTube")
            .to_string(),
        duration: value
            .get("duration")
            .and_then(|item| item.as_f64())
            .unwrap_or(0.0)
            .max(0.0) as u64,
        thumbnail: value
            .get("thumbnail")
            .and_then(|item| item.as_str())
            .unwrap_or_default()
            .to_string(),
        is_playlist,
        available_heights,
    })
}

#[tauri::command]
async fn inspect_url(app: AppHandle, url: String) -> Result<MediaInfo, String> {
    tauri::async_runtime::spawn_blocking(move || inspect_url_sync(&app, &url))
        .await
        .map_err(|error| format!("Video inspection failed: {error}"))?
}

fn validate_request(
    url: &str,
    mode: &str,
    quality: &str,
    audio_format: &str,
    folder: &str,
) -> Result<(), String> {
    let parsed = reqwest::Url::parse(url).map_err(|_| "Paste a valid video or playlist link.")?;
    if !matches!(parsed.scheme(), "http" | "https") || parsed.host_str().is_none() {
        return Err("Only http and https links can be downloaded.".into());
    }
    if !matches!(mode, "audio" | "video") {
        return Err("Choose audio or video format.".into());
    }
    let allowed = if mode == "audio" {
        matches!(quality, "best" | "320" | "256" | "192" | "128")
    } else {
        matches!(quality, "best" | "1080" | "720" | "480" | "360" | "240")
    };
    if !allowed {
        return Err("Choose one of the available quality options.".into());
    }
    if folder.trim().is_empty() {
        return Err("Choose a download folder.".into());
    }
    if mode == "audio" && !matches!(audio_format, "mp3" | "m4a" | "wav" | "opus") {
        return Err("Choose one of the available audio formats.".into());
    }
    Ok(())
}

#[tauri::command]
fn start_download(
    app: AppHandle,
    state: State<'_, Running>,
    url: String,
    mode: String,
    quality: String,
    audio_format: String,
    folder: String,
) -> Result<(), String> {
    validate_request(&url, &mode, &quality, &audio_format, &folder)?;
    if state
        .child
        .lock()
        .map_err(|_| "The downloader is busy.")?
        .is_some()
    {
        return Err("A download is already running.".into());
    }

    let ytdlp = resolve(&app, "yt-dlp").ok_or("The download engine is not set up yet.")?;
    let ffmpeg = resolve(&app, "ffmpeg").ok_or("FFmpeg is not available. Run setup first.")?;
    let deno =
        resolve(&app, "deno").ok_or("The YouTube engine is not available. Run setup first.")?;
    let audio = mode == "audio";
    let destination = PathBuf::from(&folder);
    fs::create_dir_all(&destination)
        .map_err(|error| format!("Could not create the download folder: {error}"))?;

    let filename = if audio {
        "%(playlist_index&{} - |)s%(title)s.%(ext)s"
    } else {
        "%(playlist_index&{} - |)s%(title)s [%(height)sp].%(ext)s"
    };
    let output = destination
        .join("%(playlist_title|)s")
        .join(filename)
        .to_string_lossy()
        .into_owned();

    let mut command = base_command(&ytdlp);
    command
        .arg("--ignore-config")
        .args(["--progress-template", PROGRESS_TEMPLATE])
        .args(["--output", &output])
        .args(["--ffmpeg-location", &ffmpeg])
        .args(["--js-runtimes", &format!("deno:{deno}")])
        .args(["--concurrent-fragments", "4"])
        .arg("--newline")
        .arg("--no-colors")
        .arg("--continue")
        .arg("--embed-metadata")
        .arg("--embed-thumbnail");
    if cfg!(windows) {
        command.arg("--windows-filenames");
    }

    if audio {
        let audio_quality = match quality.as_str() {
            "best" => "0".to_string(),
            bitrate => format!("{bitrate}K"),
        };
        command
            .arg("--extract-audio")
            .args(["--audio-format", &audio_format])
            .args(["--audio-quality", &audio_quality]);
    } else {
        let format_selector = if quality == "best" {
            "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best".to_string()
        } else {
            format!("bestvideo[height<={quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<={quality}][ext=mp4]/best[height<={quality}]")
        };
        command
            .args(["--format", &format_selector])
            .args(["--merge-output-format", "mp4"]);
    }

    let mut child = command
        .arg("--")
        .arg(&url)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("Could not start yt-dlp: {error}"))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    state.cancelled.store(false, Ordering::SeqCst);
    *state.child.lock().map_err(|_| "The downloader is busy.")? = Some(child);

    let stdout_thread = stdout.map(|output| {
        let app = app.clone();
        std::thread::spawn(move || {
            for line in BufReader::new(output).lines().map_while(Result::ok) {
                emit_line(&app, &line);
            }
        })
    });
    let stderr_thread = stderr.map(|output| {
        let app = app.clone();
        std::thread::spawn(move || {
            for line in BufReader::new(output).lines().map_while(Result::ok) {
                emit_line(&app, &line);
            }
        })
    });

    let child_handle = state.child.clone();
    let cancelled = state.cancelled.clone();
    std::thread::spawn(move || {
        let result = loop {
            {
                let mut guard = match child_handle.lock() {
                    Ok(guard) => guard,
                    Err(_) => return,
                };
                match guard.as_mut() {
                    Some(child) => match child.try_wait() {
                        Ok(Some(status)) => {
                            *guard = None;
                            break Ok(status);
                        }
                        Ok(None) => {}
                        Err(error) => {
                            *guard = None;
                            break Err(error);
                        }
                    },
                    None => return,
                }
            }
            std::thread::sleep(std::time::Duration::from_millis(180));
        };

        if let Some(thread) = stdout_thread {
            let _ = thread.join();
        }
        if let Some(thread) = stderr_thread {
            let _ = thread.join();
        }

        let was_cancelled = cancelled.load(Ordering::SeqCst);
        let (kind, text) = match result {
            _ if was_cancelled => (
                "cancelled",
                "Stopped. Completed files were kept.".to_string(),
            ),
            Ok(status) if status.success() => ("done", "Your download is ready.".to_string()),
            Ok(status) => (
                "error",
                format!(
                    "Download failed with status {status}. If the details show HTTP 403, update the download engine and try again."
                ),
            ),
            Err(error) => ("error", format!("yt-dlp failed: {error}")),
        };
        let _ = app.emit(
            "progress",
            Progress {
                kind,
                text,
                percent: None,
                index: None,
                total: None,
            },
        );
    });
    Ok(())
}

#[tauri::command]
fn cancel_download(state: State<'_, Running>) -> Result<(), String> {
    state.cancelled.store(true, Ordering::SeqCst);
    let mut guard = state.child.lock().map_err(|_| "The downloader is busy.")?;
    if let Some(child) = guard.as_mut() {
        child
            .kill()
            .map_err(|error| format!("Could not stop the download: {error}"))?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Running::default())
        .invoke_handler(tauri::generate_handler![
            check_tools,
            default_folder,
            setup_tools,
            inspect_url,
            start_download,
            cancel_download
        ])
        .run(tauri::generate_context!())
        .expect("error while running the Tauri application");
}
