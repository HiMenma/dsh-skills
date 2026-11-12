# 这里不放原文文件

`ASD-STE100_ISSUE9.pdf` 与 `STE100_issue9_part1_writing_rules.txt` 不入库。原因：ASD-STE100 的版权归 ASD（Brussels）所有，本仓库不再分发原文。

需要逐字核对条文时这么做：

1. 打开 [ASD 下载页](https://www.asd-ste100.org/STE_downloads.html)，免费申请 Issue 9（2025-01-15）。
2. 把 PDF 存到本目录，文件名用 `ASD-STE100_ISSUE9.pdf`。
3. 需要 `grep Rule 5.1` 这类规则号时，再从 PDF 导出一份纯文本到 `STE100_issue9_part1_writing_rules.txt`。

`install.sh` 合并写入，不会删掉你放进来的 PDF。没有这两个文件时，`../references/ste100-rules.md` 与 `../references/zh-adaptation.md` 仍然可用。
