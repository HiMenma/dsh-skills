---
name: live-stream-source-finder
description: "Find and verify working HLS/m3u8 live stream sources for a specific TV channel (IPTV 直播源), such as 五星体育, CCTV5, 广东体育, 凤凰卫视. Use when the user asks for a playable 直播源 / 直播地址 / m3u8 链接 / 看电视直播 for a named channel, or asks to check whether an IPTV source still works. Covers candidate harvesting from public IPTV repositories, tiered connectivity and decodability verification, failure-signature diagnosis, and emitting a ready-to-import m3u playlist."
---

# 直播源查找与验证

## 核心事实

公开 IPTV 源的有效率极低。实测某次查找：22 个候选里只有 2 个能播，而这 2 个最终 302 到同一个源。**必须逐个实测，不能相信列表里的"高清可用"标注。**

另一个陷阱：播放列表返回 HTTP 200 不代表能播。常见情况是播放列表正常、切片 502，或列表时间戳停在几个月前。

## 工作流

```
进度清单：
- [ ] 1. 采集候选（多渠道 grep 频道名）
- [ ] 2. 去重并归一化
- [ ] 3. 分级验证（scripts/verify_stream.py）
- [ ] 4. 截帧确认台标
- [ ] 5. 输出 m3u + 说明失效模式
```

### 第 1 步：采集候选

并行拉取多个公共 IPTV 仓库，按频道名 grep。**频道名有别名，全部都要试**：`五星体育` / `wxty` / `wuxingtiyu` / `上海五星体育`。

已验证可用的采集源（HTTP 200 且含目标频道）。把 `<别名>` 换成目标频道的任一别名：

```bash
CH='<别名>'   # 例如 五星体育
for u in \
  "https://raw.githubusercontent.com/CCSH/IPTV/main/live.txt" \
  "https://raw.githubusercontent.com/CCSH/IPTV/main/live_lite.txt" \
  "https://raw.githubusercontent.com/Guovin/iptv-api/gd/output/result.m3u" \
  "https://raw.githubusercontent.com/suxuang/myIPTV/main/ipv4.m3u" \
  "https://raw.githubusercontent.com/suxuang/myIPTV/main/ipv6.m3u" \
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/cn.m3u" \
  "https://raw.githubusercontent.com/kimentanm/aptv/master/m3u/iptv.m3u" \
  "https://raw.githubusercontent.com/laperlarossi/IPTV/main/wxty.m3u" \
; do
  f="/tmp/iptv_$(printf '%s' "$u" | md5).txt"
  curl -sL --max-time 20 -A "Mozilla/5.0" -o "$f" "$u"
  printf '%-6s %s\n' "$(grep -c "$CH" "$f")" "$u"
done
```

覆盖度最高的三个：`CCSH/IPTV` 全量列表、`Guovin/iptv-api` 的自动测活输出、`suxuang/myIPTV` 的 ipv4/ipv6 双版本。

同时用 `web_search` 搜 `<频道名> 直播源 m3u8 <当前年月>`，补充论坛和博客里的新地址。

**提取格式**：txt 列表是 `频道名,URL`，m3u 是 `#EXTINF` 下一行。用 `grep -B3 -A1` 才能同时看到标注和地址。

### 第 2 步：去重归一化

同一源常有多个入口（不同 IP、不同鉴权参数）。收集时保留 `名称|URL` 对，去重后统一验证。

**重要**：验证前先记下每个 URL 的来源仓库，失效时要能回溯。

### 第 3 步：分级验证

```bash
python3 scripts/verify_stream.py "<URL>" <标签>
```

脚本做 6 级检查，任一级失败即停并打印原因：

| 级别 | 检查 | 失败含义 |
|---|---|---|
| L1 | 播放列表 HTTP 200 且以 `#EXTM3U` 开头 | 地址死了 / 需要内网 / 鉴权失败 |
| L2 | `PROGRAM-DATE-TIME` 距今 < 6 小时 | 源已停更（列表还在但内容是旧的） |
| L3 | 首个切片 HTTP 200 且 > 50KB | CDN 封切片 / 防盗链 |
| L4 | ffprobe 能解出 codec 和分辨率 | 切片不是有效视频 |
| L5 | 连续录制 20s 且拿到 ≥15s | 流不稳定、频繁断流 |
| L6 | 截帧成功 | 供人工确认台标 |

**必须做 L6 人工确认**。台标和内容要亲眼看，不能只看分辨率——有些源指向的是广告流或别的频道。

### 第 4 步：看截帧确认

用 `read_image` 看 `frame_<标签>.png`，确认：

1. 右上角/左上角是目标频道台标
2. 画面是正常节目，不是广告、不是别的台
3. 分辨率与脚本报的一致

### 第 5 步：输出

生成 m3u 播放列表，把请求头写进 `#EXTINF`：

```
#EXTM3U x-tvg-url="https://epg.112114.xyz/pp.xml"
#EXTINF:-1 tvg-id="五星体育" tvg-name="五星体育" tvg-logo="https://live.fanmingming.cn/tv/五星体育.png" http-user-agent="iPhone" http-referrer="https://live.kankanews.com/" group-title="体育",五星体育 1080P（主源 已验证）
http://...
```

## 失效模式对照表

这是本技能最值钱的部分。看到下列信号可以直接判定，不必反复重试。

| 现象 | 判定 | 处置 |
|---|---|---|
| 播放列表 200，`PROGRAM-DATE-TIME` 是几个月前 | 源已停更 | 丢弃 |
| 播放列表 200，切片 502 | 切片 CDN 已封 | 丢弃 |
| 返回 `sign error` 文本 | `usign` 参数过期 | 丢弃，别去猜新签名 |
| 302 跳到 `playad.m3u8` 之类 | 被导向广告流 | 丢弃 |
| 403 + 大段 HTML 错误页 | 官方防盗链拦截 | 丢弃 |
| 连接超时 / `Empty reply from server` | 运营商内网地址，需对应宽带 | 标注"需XX运营商" |
| TLS `handshake failure` | 服务端下线 | 丢弃 |
| 返回"此时段不提供电视网络转播服务" | 官方限时转播 | 换时段或换源 |
| IPv6 地址全超时 | 需先做对照测试（见下） | 见下 |

**IPv6 判定法**：先测 `curl -s6 https://ipv6.google.com`。若返回 200 说明本机 IPv6 正常，那么组播地址超时就是地址本身不可达，不是本机问题。

## 常见坑

**ffprobe 不支持 `-nostdin`**。加上会报 `Failed to set value '-v' for option 'nostdin'`，stdout 为空，导致所有源被误判为失败。正确做法是 `ffprobe ... </dev/null`。

**ffmpeg 在 `while read` 循环里会吞掉输入**。批量验证时必须给 ffmpeg 加 `-nostdin`，并给循环体加 `</dev/null`，否则循环只跑一两轮就结束，结果错位。

**相对切片路径必须基于重定向后的最终 URL**。源常 302 到另一个 host，切片写的是相对路径。用原始 URL 拼接会 404，要用 `curl -w '%{url_effective}'` 拿到最终地址再 `urljoin`。

**"备用源"可能是同一个源**。两个入口 302 到同一个 CDN 地址时，不是真备份。输出时要说明，别让用户误以为有冗余。

**macOS bash 3.2 处理中文变量易崩**。验证脚本用 Python 写，不要用 shell。

## 频道名别名参考

| 频道 | grep 关键词 |
|---|---|
| 五星体育 | `五星体育` `wxty` `wuxingtiyu` `上海五星体育` |
| 广东体育 | `广东体育` `gdty` |
| CCTV5 | `CCTV5` `cctv5` `体育赛事` |
| 凤凰卫视 | `凤凰` `phoenix` |
| 劲爆体育 | `劲爆体育` `jbty` |

## 输出要求

1. 给主源和备用源各一条，注明哪个实测通过、录制时长、分辨率
2. 明确写出需要的请求头
3. 附失效模式诊断表，说明其余候选为什么不行——用户下次可以自己判断
4. 附截帧图片作为证据
5. 声明：第三方转播源非官方授权，地址和鉴权参数随时失效，不传播、不商用

## 更稳的方案

公开源失效时，官方渠道 + 社区工具比继续找源可靠：

- SMG 系（含五星体育）：官方 [live.kankanews.com](https://live.kankanews.com/huikan?id=10)，配合 [Popukok/smg_live](https://github.com/Popukok/smg_live) 油猴脚本在官方页面内动态取址
- 微信内直播：`gsports-wxtv.smgtech.net`，配合 [cworld1/five-star-stream](https://github.com/cworld1/five-star-stream) 本地中转

官方 CDN 有防盗链且 m3u8 有效期很短（部分仅几分钟），直接抓地址容易触发 IP 封锁。优先建议用户用官方 App/网页观看。

## 资源

- `scripts/verify_stream.py` — 分级验证脚本，6 级检查，用法见第 3 步
