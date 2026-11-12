---
name: wechat-article-read
description: "读取微信公众号（mp.weixin.qq.com）文章链接并输出干净的 Markdown：标题、作者、公众号、发布时间、正文、图片。当用户发来 mp.weixin.qq.com 链接并要求读取、查看、总结、转存、转 Markdown、提取全文，或提到公众号文章 403/抓不到/验证码时使用。带桌面浏览器 User-Agent 直取 HTML 并解析 #js_content 与 data-src，零第三方依赖。只负责读取与提取；若用户要求核实文中事实，改用 article-claim-factcheck。"
---

# 微信公众号文章读取

## 适用

- 用户发来 `mp.weixin.qq.com/s/...`、`mp.weixin.qq.com/s?__biz=...` 等公众号文章链接。
- 用户意图是**读取类**：看一下、读一下、总结、提取全文、转 Markdown、保存/下载、抓取。
- 用户提到公众号文章「403」「抓不到」「未知错误」「验证码」「返回空」。
- 不适用：核实文中事实主张（用 `article-claim-factcheck`）；视频口播（用 `video-claim-factcheck`）。

## 关键结论（不要重新试错）

微信按 **User-Agent** 做第一道风控分流：

| 请求 | 结果 |
|---|---|
| 裸 `curl` / `python-requests` / `Go-http-client` / 空 UA | 302 跳 `/mp/wappoc_appmsgcaptcha`，标题「未知错误」，部分客户端显示 403 |
| **只加桌面版 Chrome UA** | **200 + 完整正文（约 3.6 MB HTML）** |
| 再补 Referer / Accept / Accept-Language | 无差别，非必要 |
| 伪装微信内置浏览器 UA（`MicroMessenger`） | **也被拦**，不要这么做 |

所以：**不要去绕 403，不要堆请求头，不要先上第三方 reader 服务。直接带一个桌面 Chrome UA 直取即可。** 也不需要 Cookie、登录态、微信客户端。

解析要点（否则会拿到空正文或丢图）：
1. 正文在 `<div id="js_content">`，不在 `<article>`，也不在 DOM 渲染后的可见文本里。
2. 图片真实地址在 **`data-src`**（懒加载），`src` 常是占位或 JS 拼接串。取 `data-src` 才能拿到 `mmbiz.qpic.cn` 图片。
3. 元数据不在 `#publish_time`（该标签为空、由 JS 填充），真实值在页面 JS 变量：`var msg_title`、`var author`、`var nickname = htmlDecode(...)`、`var createTime`、`var ct`（10 位秒级时间戳）。
4. **判断是否被拦不能只看 HTTP 状态码**。`web_fetch` 会报「HTTP 200」但返回空正文，因为拿到的是验证壳。必须检查 HTML 是否含 `js_content` / `wappoc_appmsgcaptcha` / `环境异常`。

## 工作流

### 1. 直接用脚本读取（默认路径）

脚本：`scripts/wechat_read.py`（Python 标准库，零依赖，已在本 skill 内）。

```bash
python3 "<skill-dir>/scripts/wechat_read.py" "<url>"
python3 "<skill-dir>/scripts/wechat_read.py" "<url>" -o article.md
python3 "<skill-dir>/scripts/wechat_read.py" "<url1>" "<url2>" -o all.md
```

`<skill-dir>` 是本 SKILL.md 所在目录的绝对路径。不要省略路径去 `python3 wechat_read.py`，工作目录不一定在 skill 里。

输出为带 YAML frontmatter 的 Markdown：`title` / `author` / `account` / `date` / `url`，随后是正文，含 `![](data-src)` 图片。

### 2. 按用户意图决定输出形态

| 用户说 | 输出 |
|---|---|
| 「读一下」「看看这篇」 | 3–6 条基于原文的简要摘要 + 关键细节，不要把全文倒给用户 |
| 「总结」「讲了什么」 | 摘要 + 文章主线 |
| 「全文」「转 Markdown」「保存」「下载」 | 完整 Markdown；保存到用户指定目录，未指定则存到会话临时目录并报告路径 |
| 「提取数据/时间线」 | 提取对应字段，不要顺带做事实核查 |
| 「核实」「这说法对不对」 | 停止本 skill，改用 `article-claim-factcheck` |

### 3. 失败时的降级顺序

1. 脚本报「被反爬拦截」：降速重试一次（间隔 ≥ 2 秒）。多数情况是频率或 IP，不是代码问题。
2. 仍失败：用真实浏览器渲染。`read` skill 自带 `scripts/fetch_weixin.py`（Playwright + BeautifulSoup，`page.wait_for_selector('#js_content')`），首次需 `pip install playwright beautifulsoup4 lxml && playwright install chromium`。
3. 仍失败或文章已删：明确告诉用户抓不到，不要编造内容。可尝试搜索标题找转载镜像，并标注来源层级。
4. 第三方提取服务（`r.jina.ai`、`defuddle.md`、DeepSeek Fetch API）：**仅公开文章、且用户明确同意**才用。它们会收到 URL 并可能缓存。付费、内部、需登录的文章绝不外送。

### 4. 校验

输出前确认：正文非空、有段落、`![](` 数量与页面图片数一致、frontmatter 四个字段齐全。若 `title` 或 `date` 为空，读一下原始 HTML 里的 `msg_title` / `createTime` 变量名是否变了（微信会改页面结构），按需更新脚本正则。

## 边界

- 只读取，不对文章观点做真伪判断。文中事实未核查时，若要引用，提醒用户单独核实。
- 不批量高频抓取；分页间隔、限速由调用方控制。
- 遵守微信对付费/登录内容的限制，不绕过付费墙。
