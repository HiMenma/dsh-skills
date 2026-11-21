#!/usr/bin/env python3
"""分级验证 HLS 直播源。用法: verify_stream.py <url> [label]

L1 播放列表可达 -> L2 时间戳新鲜度 -> L3 切片可下载 -> L4 可解码
-> L5 连续录制 20s -> L6 截帧
任一级失败即停并打印该级原因。成功时打印 OK 行并输出截帧。
"""
import json
import os
import subprocess
import sys
import tempfile
import urllib.parse
from datetime import datetime, timezone

UA = os.environ.get("UA", "iPhone")
REFERER = os.environ.get("REFERER", "https://live.kankanews.com/")
RECORD_SECONDS = int(os.environ.get("RECORD_SECONDS", "20"))


def run(cmd, timeout=60):
    return subprocess.run(cmd, capture_output=True, timeout=timeout,
                          stdin=subprocess.DEVNULL)


def curl(url, out, timeout=20):
    """返回 (http_code, 重定向后的最终 URL)。"""
    r = run(["curl", "-sL", "--max-time", str(timeout), "-A", UA,
             "-e", REFERER, "-o", out,
             "-w", "%{http_code}\n%{url_effective}", url],
            timeout=timeout + 15)
    body = r.stdout.decode(errors="replace").strip().splitlines()
    code = body[0] if body else ""
    final = body[1] if len(body) > 1 else url
    return code, final


def fail(level, msg):
    print(f"FAIL {LABEL} | L{level} | {msg}")
    sys.exit(1)


def main():
    url = sys.argv[1]
    tmp = tempfile.mkdtemp(prefix="streamchk_")

    # L1 播放列表可达且是 m3u8
    pl = os.path.join(tmp, "playlist.m3u8")
    code, final_url = curl(url, pl)
    if code != "200":
        fail(1, f"playlist HTTP {code}")
    text = open(pl, "rb").read().decode("utf-8", "replace")
    if not text.lstrip().startswith("#EXTM3U"):
        fail(1, f"不是 m3u8: {text[:80]!r}")

    # L2 时间戳新鲜度（仅主播放列表含 PROGRAM-DATE-TIME 时适用）
    for line in text.splitlines():
        if line.startswith("#EXT-X-PROGRAM-DATE-TIME:"):
            raw = line.split(":", 1)[1].strip().replace("Z", "+00:00")
            try:
                pdt = datetime.fromisoformat(raw)
            except ValueError:
                break
            if pdt.tzinfo is None:
                pdt = pdt.replace(tzinfo=timezone.utc)
            age_h = (datetime.now(timezone.utc) - pdt).total_seconds() / 3600
            if age_h > 6:
                fail(2, f"时间戳停在 {raw}，约 {age_h:.0f}h 前，源已停更")
            break

    # L3 切片可下载
    segs = [l.strip() for l in text.splitlines()
            if l.strip() and not l.startswith("#")]
    if not segs:
        fail(3, "播放列表无切片条目")
    # 相对切片路径必须基于重定向后的最终 URL 拼接
    segurl = urllib.parse.urljoin(final_url, segs[0])
    ts = os.path.join(tmp, "seg.ts")
    scode, _ = curl(segurl, ts)
    if scode != "200":
        fail(3, f"切片 HTTP {scode}")
    if os.path.getsize(ts) < 50000:
        fail(3, f"切片仅 {os.path.getsize(ts)}B，疑似错误页")

    # L4 可解码（ffprobe 不支持 -nostdin，靠 stdin=DEVNULL）
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=codec_name,width,height",
             "-of", "csv=p=0", ts])
    probe = r.stdout.decode(errors="replace").strip().splitlines()
    if not probe or not probe[0]:
        fail(4, "ffprobe 无法解码切片")

    # L5 连续录制
    rec = os.path.join(tmp, "rec.ts")
    run(["ffmpeg", "-nostdin", "-v", "error", "-rw_timeout", "20000000",
         "-i", url, "-t", str(RECORD_SECONDS), "-c", "copy", "-y", rec],
        timeout=RECORD_SECONDS + 60)
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", rec])
    dur = r.stdout.decode(errors="replace").strip()
    if not dur:
        fail(5, f"连续录制失败（{RECORD_SECONDS}s 未取到流）")
    if float(dur) < RECORD_SECONDS * 0.75:
        fail(5, f"仅录到 {dur}s，流不稳定")

    # L6 截帧供人工确认台标
    frame = os.path.join(tmp, "frame.png")
    run(["ffmpeg", "-nostdin", "-v", "error", "-ss", "3", "-i", rec,
         "-frames:v", "1", "-y", frame])
    out_frame = f"frame_{LABEL}.png"
    if os.path.exists(frame):
        os.replace(frame, out_frame)

    print(f"OK   {LABEL} | {probe[0]} | 录制 {dur}s | 截帧 {out_frame}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: verify_stream.py <url> [label]")
    LABEL = sys.argv[2] if len(sys.argv) > 2 else str(abs(hash(sys.argv[1])) % 10**6)
    main()
