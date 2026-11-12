#!/usr/bin/env python3
"""读取微信公众号文章正文，输出 Markdown（仅依赖 Python 标准库）。

用法:
    python3 wechat_read.py <url> [<url> ...]
    python3 wechat_read.py <url> -o article.md

要点:
  mp.weixin.qq.com 会对无浏览器特征的请求返回 302，跳到
  /mp/wappoc_appmsgcaptcha（验证码页，标题「未知错误」），
  部分客户端/地区表现为 403。带一个桌面版 Chrome User-Agent 即可拿到
  完整 HTML；不需要 Cookie、Referer、登录或微信客户端 UA。

  正文在 <div id="js_content">，图片地址在 data-src（懒加载），
  不在 src。若页面缺 #js_content，说明被反爬拦了，改用真实浏览器渲染。
"""

from __future__ import annotations

import argparse
import html as html_lib
import re
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

# 桌面版 Chrome UA 是关键；伪装成 MicroMessenger / 微信内置浏览器反而会被拦。
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

CAPTCHA_MARKERS = ("wappoc_appmsgcaptcha", "环境异常", "去验证", "未知错误")


def fetch(url: str, timeout: int = 20) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    # 直连；urllib 默认会读 http_proxy/https_proxy 环境变量。
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def meta(page: str) -> dict:
    def grab(pattern: str, default: str = "") -> str:
        m = re.search(pattern, page, re.S)
        return html_lib.unescape(m.group(1).strip()) if m else default

    def strip_tags(s: str) -> str:
        return re.sub(r"<[^>]+>", "", s).strip()

    # 标题常见写法：var msg_title = 'xxx'.html(false);
    title = grab(r'var\s+msg_title\s*=\s*[\'"](.*?)[\'"]\s*\.html\(false\)')
    if not title:
        title = strip_tags(grab(r'<h1[^>]*id="activity-name"[^>]*>(.*?)</h1>'))

    # 公众号名：var nickname = htmlDecode("远方青木"); 注意等号后是 htmlDecode(
    account = grab(r'var\s+nickname\s*=\s*htmlDecode\(["\'](.*?)["\']\)')
    if not account:
        account = grab(r'var\s+nickname\s*=\s*["\'](.*?)["\']')
    if not account:
        account = grab(r'data-nickname=\\?["\'](.*?)\\?["\']')

    # 作者：真实变量名是 var author（不是 msg_author）
    author = grab(r'var\s+author\s*=\s*["\'](.*?)["\']')
    if not author:
        author = grab(r'id="js_author_name"[^>]*>(.*?)<')

    # 发布时间：DOM 里 #publish_time 是空的，由 JS 填充；真实值在 createTime / ct
    date = grab(r"var\s+createTime\s*=\s*['\"](.*?)['\"]")
    if not date:
        ct = grab(r'var\s+ct\s*=\s*["\'](\d{10})["\']')
        if ct:
            import datetime
            date = datetime.datetime.fromtimestamp(
                int(ct), datetime.timezone(datetime.timedelta(hours=8))
            ).strftime("%Y-%m-%d %H:%M")

    return {"title": title, "author": author, "date": date, "account": account}


def content_html(page: str) -> str | None:
    """取 #js_content 的 innerHTML。用栈匹配 div，避免嵌套 div 截断。"""
    start = re.search(r'<div[^>]*\bid=["\']js_content["\'][^>]*>', page, re.I)
    if not start:
        return None
    i = start.end()
    depth = 1
    token = re.compile(r"<(/?)div\b[^>]*>", re.I)
    for m in token.finditer(page, i):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return page[i : m.start()]
    return None


BLOCK = {"p", "div", "section", "article", "li", "ul", "ol", "br", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"}
DROP = {"script", "style", "noscript"}


class ToMarkdown(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.out: list[str] = []
        self.drop_depth = 0
        self.href: str | None = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in DROP:
            self.drop_depth += 1
            return
        if self.drop_depth:
            return
        if tag == "img":
            # 微信正文图片是懒加载：真实地址在 data-src，src 常是占位/空。
            src = a.get("data-src") or a.get("src") or ""
            if src and not src.startswith("data:"):
                self.out.append(f"\n\n![{a.get('alt', '')}]({html_lib.unescape(src)})\n\n")
        elif tag == "a" and a.get("href"):
            self.href = html_lib.unescape(a["href"])
            self.out.append("[")
        elif tag == "br":
            self.out.append("\n")
        elif tag in ("strong", "b"):
            self.out.append("**")
        elif tag in ("em", "i"):
            self.out.append("*")
        elif tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.out.append("\n\n" + "#" * int(tag[1]) + " ")
        elif tag == "blockquote":
            self.out.append("\n\n> ")
        elif tag == "li":
            self.out.append("\n- ")
        elif tag in BLOCK:
            self.out.append("\n\n")

    def handle_endtag(self, tag):
        if tag in DROP:
            self.drop_depth = max(0, self.drop_depth - 1)
            return
        if self.drop_depth:
            return
        if tag == "a" and self.href:
            self.out.append(f"]({self.href})")
            self.href = None
        elif tag in ("strong", "b"):
            self.out.append("**")
        elif tag in ("em", "i"):
            self.out.append("*")
        elif tag in BLOCK:
            self.out.append("\n\n")

    def handle_data(self, data):
        if not self.drop_depth:
            self.out.append(data)

    def text(self) -> str:
        raw = "".join(self.out)
        lines = [re.sub(r"[ \t\u00a0]+", " ", ln).strip() for ln in raw.splitlines()]
        cleaned: list[str] = []
        blank = False
        for ln in lines:
            if not ln:
                if not blank and cleaned:
                    cleaned.append("")
                blank = True
            else:
                cleaned.append(ln)
                blank = False
        return "\n".join(cleaned).strip()


def to_markdown(url: str) -> str:
    page = fetch(url)
    has_body = re.search(r'<div[^>]*\bid=["\']js_content["\']', page, re.I)
    if not has_body or any(k in page for k in CAPTCHA_MARKERS):
        raise RuntimeError(
            "被反爬拦截（captcha/验证页，浏览器里常显示 403）。"
            "请改用真实浏览器渲染：Playwright + page.wait_for_selector('#js_content')，"
            "或降低频率后重试。"
        )
    body = content_html(page)
    if not body:
        raise RuntimeError("已拿到 HTML 但找不到 #js_content，页面结构可能变了。")
    p = ToMarkdown()
    p.feed(body)
    m = meta(page)
    head = [
        "---",
        f'title: "{m["title"]}"',
        f'author: "{m["author"]}"',
        f'account: "{m["account"]}"',
        f'date: "{m["date"]}"',
        f"url: {url}",
        "---",
        "",
    ]
    return "\n".join(head) + (f'# {m["title"]}\n\n' if m["title"] else "") + p.text() + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description="读取微信公众号文章为 Markdown（零依赖）")
    ap.add_argument("urls", nargs="+", help="mp.weixin.qq.com 文章链接")
    ap.add_argument("-o", "--output", help="写入文件（默认打印到 stdout）")
    args = ap.parse_args()

    results = []
    for url in args.urls:
        try:
            results.append(to_markdown(url))
        except Exception as exc:
            print(f"[fail] {url}: {exc}", file=sys.stderr)
            results.append("")

    text = "\n\n---\n\n".join(r for r in results if r)
    if args.output:
        Path(args.output).write_text(text, encoding="utf-8")
        print(f"saved: {args.output}", file=sys.stderr)
    else:
        sys.stdout.write(text)
    return 0 if any(results) else 1


if __name__ == "__main__":
    sys.exit(main())
