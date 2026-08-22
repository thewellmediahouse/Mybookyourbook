#!/usr/bin/env python3
"""Private media branding HTTP service. Not exposed on the public internet."""

from __future__ import annotations

import json
import os
import re
import struct
import subprocess
import tempfile
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

PORT = 8080
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
CUSTOMER_ERROR = "unavailable"
MAX_BODY = 250 * 1024 * 1024


def secret_ok(handler: BaseHTTPRequestHandler) -> bool:
    expected = os.environ.get("INTERNAL_SERVICE_SECRET", "").strip()
    provided = handler.headers.get("X-Internal-Secret", "")
    return bool(expected) and provided == expected


def encode_envelope(meta: dict[str, Any], thumb: bytes, video: bytes) -> bytes:
    meta_b = json.dumps(meta).encode("utf-8")
    return b"CYB1" + struct.pack(">I", len(meta_b)) + meta_b + struct.pack(">I", len(thumb)) + thumb + video


def run(cmd: list[str], timeout: int = 540) -> None:
    result = subprocess.run(cmd, capture_output=True, timeout=timeout, check=False)
    if result.returncode != 0:
        raise RuntimeError("encode failed")


def probe(path: Path) -> dict[str, Any]:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(path),
        ],
        capture_output=True,
        timeout=60,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError("inspect failed")
    payload = json.loads(result.stdout.decode("utf-8") or "{}")
    video = next((s for s in payload.get("streams", []) if s.get("codec_type") == "video"), {})
    audio = next((s for s in payload.get("streams", []) if s.get("codec_type") == "audio"), {})
    width = int(video.get("width") or 0) or None
    height = int(video.get("height") or 0) or None
    duration = payload.get("format", {}).get("duration")
    fps = None
    rate = video.get("avg_frame_rate") or video.get("r_frame_rate")
    if isinstance(rate, str) and "/" in rate:
        num, den = rate.split("/", 1)
        try:
            fps = round(float(num) / float(den)) if float(den) else None
        except ValueError:
            fps = None
    try:
        duration_seconds = round(float(duration)) if duration is not None else None
    except ValueError:
        duration_seconds = None
    return {
        "width": width,
        "height": height,
        "durationSeconds": duration_seconds,
        "fps": fps,
        "videoCodec": video.get("codec_name"),
        "audioCodec": audio.get("codec_name"),
        "container": (payload.get("format", {}).get("format_name") or "mp4").split(",")[0],
        "sizeBytes": path.stat().st_size,
    }


def canvas_for(width: int | None, height: int | None) -> tuple[int, int]:
    w = width or 1080
    h = height or 1920
    if w >= h * 1.15:
        return 1920, 1080
    if h >= w * 1.15:
        return 1080, 1920
    return 1080, 1080


def overlay_xy(position: str) -> str:
    if position == "top-left":
        return "40:40"
    if position == "top-right":
        return "W-w-40:40"
    if position == "bottom-left":
        return "40:H-h-40"
    return "W-w-40:H-h-40"


def parse_multipart(handler: BaseHTTPRequestHandler, body: bytes) -> dict[str, bytes]:
    content_type = handler.headers.get("Content-Type", "")
    match = re.search(r"boundary=([^;]+)", content_type)
    if not match:
        raise ValueError("boundary")
    boundary = match.group(1).strip().strip('"').encode("utf-8")
    parts: dict[str, bytes] = {}
    for raw in body.split(b"--" + boundary):
        raw = raw.strip(b"\r\n")
        if not raw or raw == b"--":
            continue
        header_blob, _, data = raw.partition(b"\r\n\r\n")
        if data.endswith(b"\r\n"):
            data = data[:-2]
        disposition = ""
        for line in header_blob.split(b"\r\n"):
            if line.lower().startswith(b"content-disposition:"):
                disposition = line.decode("utf-8", "replace")
        name_match = re.search(r'name="([^"]+)"', disposition)
        if not name_match:
            continue
        parts[name_match.group(1)] = data
    return parts


def brand(parts: dict[str, bytes], work: Path) -> bytes:
    options = json.loads((parts.get("options") or b"{}").decode("utf-8"))
    lines = [str(item).strip() for item in options.get("lines") or [] if str(item).strip()]
    position = str(options.get("logoPosition") or "none")
    include_end = bool(options.get("includeEndCard")) and bool(lines)
    source = work / "source.mp4"
    source.write_bytes(parts["video"])
    info = probe(source)
    canvas_w, canvas_h = canvas_for(info.get("width"), info.get("height"))
    vf = f"scale={canvas_w}:{canvas_h}:force_original_aspect_ratio=decrease,pad={canvas_w}:{canvas_h}:(ow-iw)/2:(oh-ih)/2"
    logo_path: Path | None = None
    if position != "none" and parts.get("logo"):
        ext = ".png"
        logo_path = work / f"logo{ext}"
        logo_path.write_bytes(parts["logo"])
        vf = (
            f"[0:v]scale={canvas_w}:{canvas_h}:force_original_aspect_ratio=decrease,"
            f"pad={canvas_w}:{canvas_h}:(ow-iw)/2:(oh-ih)/2[base];"
            f"[1:v]scale=180:-1[lg];[base][lg]overlay={overlay_xy(position)}"
        )
    main = work / "main.mp4"
    if logo_path:
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(source),
                "-i",
                str(logo_path),
                "-filter_complex",
                vf,
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                "20",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                "-movflags",
                "+faststart",
                str(main),
            ]
        )
    else:
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(source),
                "-vf",
                vf,
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                "20",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                "-movflags",
                "+faststart",
                str(main),
            ]
        )

    output = main
    if include_end:
        card = work / "card.mp4"
        text_filters: list[str] = []
        for index, line in enumerate(lines[:4]):
            text_path = work / f"line-{index}.txt"
            text_path.write_text(line, encoding="utf-8")
            y = f"h*0.52+{index}*64"
            text_filters.append(
                f"drawtext=fontfile={FONT}:textfile={text_path}:fontcolor=0xF7F5EF:fontsize=36:x=(w-text_w)/2:y={y}"
            )
        card_inputs = [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c=0x08090B:s={canvas_w}x{canvas_h}:d=2.5:r=24",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=48000:cl=stereo",
        ]
        if logo_path:
            card_inputs.extend(["-i", str(logo_path)])
            card_vf = (
                f"[0:v]scale={canvas_w}:{canvas_h}[bg];[2:v]scale=220:-1[lg];"
                f"[bg][lg]overlay=(W-w)/2:H*0.22[v]"
            )
            if text_filters:
                card_vf += ";[v]" + ",".join(text_filters)
            run(
                card_inputs
                + [
                    "-filter_complex",
                    card_vf,
                    "-t",
                    "2.5",
                    "-c:v",
                    "libx264",
                    "-pix_fmt",
                    "yuv420p",
                    "-c:a",
                    "aac",
                    "-shortest",
                    str(card),
                ]
            )
        else:
            card_vf = f"scale={canvas_w}:{canvas_h}"
            if text_filters:
                card_vf = f"{card_vf}," + ",".join(text_filters)
            run(
                card_inputs
                + [
                    "-vf",
                    card_vf,
                    "-t",
                    "2.5",
                    "-c:v",
                    "libx264",
                    "-pix_fmt",
                    "yuv420p",
                    "-c:a",
                    "aac",
                    "-shortest",
                    str(card),
                ]
            )
        concatted = work / "final.mp4"
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(main),
                "-i",
                str(card),
                "-filter_complex",
                "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]",
                "-map",
                "[v]",
                "-map",
                "[a]",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-movflags",
                "+faststart",
                str(concatted),
            ]
        )
        output = concatted

    thumb = work / "thumb.jpg"
    run(["ffmpeg", "-y", "-ss", "1", "-i", str(output), "-frames:v", "1", "-q:v", "4", str(thumb)])
    meta = probe(output)
    meta["sizeBytes"] = output.stat().st_size
    return encode_envelope(meta, thumb.read_bytes(), output.read_bytes())


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        return

    def _send(self, status: int, body: bytes, content_type: str = "text/plain") -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path.split("?", 1)[0] == "/health":
            self._send(200, b'{"ok":true}', "application/json")
            return
        self._send(404, b"not found")

    def do_POST(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path not in ("/brand", "/inspect"):
            self._send(404, b"not found")
            return
        if not secret_ok(self):
            self._send(401, b"unauthorized")
            return
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0 or length > MAX_BODY:
            self._send(413, b"too large")
            return
        body = self.rfile.read(length)
        try:
            if path == "/inspect":
                with tempfile.TemporaryDirectory() as tmp:
                    source = Path(tmp) / "in.mp4"
                    source.write_bytes(body)
                    payload = json.dumps(probe(source)).encode("utf-8")
                self._send(200, payload, "application/json")
                return
            parts = parse_multipart(self, body)
            if "video" not in parts:
                self._send(400, b"missing video")
                return
            with tempfile.TemporaryDirectory() as tmp:
                packed = brand(parts, Path(tmp))
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("X-Thumbnail-Type", "image/jpeg")
            self.send_header("Content-Length", str(len(packed)))
            self.end_headers()
            self.wfile.write(packed)
        except Exception:
            traceback.print_exc()
            self._send(500, CUSTOMER_ERROR.encode("utf-8"))


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
