# ASD-STE100 Part 1 写作规则要点（Issue 9，2025-01-15）

来源：ASD（原 AECMA）官方发布的《Simplified Technical English》Issue 9，2025-01-15，免费分发。本文件按原文核对写成，规则号、数字上限、英文原句均取自该文本。

- Part 1 = 写作规则（语法与文体），**9 节 53 条规则**，另有第 9 节的 **GR-1～GR-8 通用建议**。原文注明："The general recommendations (GR) in this section are not STE rules."
- Part 2 = 受控词典：**875 个批准词** + **1274 个不批准词**（大写＝批准，小写＝不批准，须改用给出的 ALTERNATIVES）。
- 规则格式：每节先列 Summary，再逐条展开，配 **Non-STE:** / **STE:** 成对例句。
- 第 4 节引言把基本出发点写成一句："The basic principle of STE is to make texts easy to read and understand."（Issue 9 没有编号的 Principles 列表。）
- 翻译取向（总引言原文）：控制用词、词义和句型之后，"it is easier for translators, neural machine translation engines, and Large Language Models (LLM) to translate text written in STE into the target language."

原文全量核对用：`assets/ASD-STE100_ISSUE9.pdf`（sha256 d1f4ea9e…166431）、`assets/STE100_issue9_part1_writing_rules.txt`（Part 1 提取文本，可 grep `Rule 5.1` 这类规则号）。

## 第 1 节 词（1.1–1.14）

- **1.1** 只用词典批准词、技术名词（TN）、技术动词（TV）。
- **1.2** 批准词只能用作指定的词性。Non-STE: `Test the system for leaks.` → STE: `Do the leak test of the system.`（test 只批准为名词）
- **1.3** 批准词只能取其批准词义。`follow` 只有"紧跟／次序在后"义 → `Follow the safety instructions.` 应写 `Obey the safety instructions.`
- **1.5** TN 有 **22 个类别**。节选（完整 22 类 grep `Rule 1.5`）：
  - 官方件号信息
  - 装备、机器与场所
  - 工具与保障设备
  - 材料与消耗品
  - 系统、部件与电路
  - 数学与工程术语、公式
  - 数值、计量单位与时间
  - 被引文本
  - 颜色、损伤
  - 计算机与 ICT
  - 法规
- **1.6／1.7** 未批准词只能在属于 TN 时用；**不许把 TN 当动词**：`Oil the steel surfaces.` → `Apply oil to the steel surfaces.`
- **1.9** 选 TN 时取短的（**不超过三词**）且易懂的。
- **1.10／1.11** 不用地区俚语行话；同一件物**只许一个名字**（不许 actuator／control unit／servo control unit 混用）。
- **1.12／1.13** TV 有 **4 个类别**；不许 TV 作名词。
- **1.14** 拼写用美式英语。

## 第 2 节 多词名词（2.1–2.2）

- **2.1** 多词名词**不超过三词**。Non-STE: `Runway light connection resistance calibration` → STE: `Calibration of the resistance of the runway light connection.`
- **2.2** TN 超过三词时：首次写全，之后给短形式或缩写，或用连字符把作为一个整体的词连起来（`main-gear-door retraction-winch handle`）。连字符词在计数时算一个词。

## 第 3 节 动词（3.1–3.7）

- **3.2** 只许这些动词形式与时态：不定式、祈使、**一般现在**、**一般过去**、**一般将来（will）**、过去分词作形容词。**明确不批准**现在完成（have adjusted）、过去完成（had adjusted）、进行时（is/was adjusting）及一切复杂动词结构。
- **3.3** 过去分词作形容词表状态，不是被动：`When the unit is fully disassembled, clean all the parts.`
- **3.4** 不用助动词造复杂结构。`The volume control can be adjusted.` → `You can adjust the volume control.`
- **3.5** `-ing` 只许作 TN 或 TN 的修饰语，其余一般不允许（词性歧义）。
- **3.6** **用主动语态。描述性文字里，只有施动者未知时才可用被动。** Non-STE: `The sleeve will be adjusted by the robot.` → STE: `The robot will adjust the sleeve.`
- **3.7** 用批准的**动词**表动作，不要用名词化结构。`The ohmmeter gives an indication of 450 ohms.` → `The ohmmeter shows 450 ohms.`
  - 与 1.2 的相互作用：动词本身未批准时，STE 反而要用名词结构（`check`、`test` 只批准为名词 → `Do a check of the laptop battery.`）。这与一般"简明英语"建议相反。

## 第 4 节 句子（4.1–4.5）

- **4.1** 写短而明确的句子；描述句**一句一个主题**；写具体不写抽象：`No leaks are permitted.` → `Make sure that there are no leaks.`
- **4.2** 不许为省字而省略成分，不许用缩略形式（don't／isn't）。`If installed, remove the shims.` → `If shims are installed, remove them.`
- **4.3** 纵向列表规则：引导句以**冒号**结尾；条目首字母大写；条目末尾**不加逗号或分号**，只有整句才加句号；一个列表里不混装指令与描述；安全事项的每个条目都要重复 `DO NOT`；不嵌套子列表（改用括号）。
- **4.4** 用批准的连接词衔接句间逻辑：and, but, then, thus, as a result, at the same time。
- **4.5** 名词前该写的冠词要写；泛指的总述不写冠词；带件号的名词前不写 the（`Tag circuit breaker 36L7`）。

## 第 5 节 程序性文字（5.1–5.5）

- **5.1** **每句最多 20 词**，警告与注意同样受这条限制；5.5 的 note 例外（25 词）。
- **5.2** **每句只给一个指令**，除非几个动作同时发生：`Cut and remove the wire.` 可以。
- **5.3** 指令用祈使句。`The test can be continued.` → `Continue the test.` 除非涉及安全或重要条件，**不要在祈使句前加 must**。
- **5.4** 读者需要先知道的条件**写在句首**，用逗号与指令分开：`Set the switch to NORMAL when the light comes on` → `When the light comes on, set the switch to NORMAL.`
- **5.5** note 只给信息，**不得含指令、要求或限制**；判据：把 note 全删掉，步骤仍能执行。

## 第 6 节 描述性文字（6.1–6.6）

- **6.1** 信息逐步给，一句一主语。
- **6.2** 关键词与关键短语**原样重复**，不换同义词。
- **6.3** **每句最多 25 词。**
- **6.4／6.5** 段落以一个主题句开头，一段一个主题。
- **6.6** **一段不超过六句。**

## 第 7 节 安全指令（7.1–7.3）

- 定义原文：**warning** ＝ 有伤亡风险；**caution** ＝ 有物件损坏风险；两类风险同时存在时用 warning。
- **7.1** 先判定风险级别并选用对应词；**7.2** 开头写明确的**指令或条件**（先说怎么防）；**7.3** 再写**说明风险或后果**的解释。安全文字同样受 20 词限制。

## 第 8 节 标点与计词（8.1–8.7）

- **8.1** 英文标点除**分号（;）**外都可用。分号被排除的理由是"它让你写出很长的句子"，应拆成两句。
- **8.2** 连字符只用于几类紧邻组合：名词前的复合修饰语（`low-altitude flight`）、两位数字与分数、字母＋名词（`L-shaped bracket`）、动词＋名词复合（`short-circuit`）。
- **8.3** 括号只有 7 种批准用途，其中两例：图注件号、并列备选 `Open the left (right) access panel L42 (R42).`
- **8.4** 列表里，冒号按句号计：冒号前受 20／25 词限制，**每个条目各算一句**、各自受限于同一上限。
- **8.5–8.7** 括号内容算作本句的一个词，同时括号内文字自身成句计数；数字、数字＋单位（`10 °C`）、缩写与首字母词、件号（`36L7`）、被引文本、公式、专有名词各算一个词；连字符词算一个词。

## 第 9 节 写作实践（9.1–9.4，另含 GR-1–GR-8）

- **9.1** 逐词替换不够时，改换整句句构。原文目标句：`The primary objective of STE is that readers immediately understand each sentence that they read.`
- **9.2** 批准词有其受限词义：`wear` 只有"摩擦损耗"义（穿衣用 `use`／`put on`）；`above`／`below` 只表物理位置，**不表数值上下限**（极限用 `less than`／`more than`）。
- **9.3** **不要造短语动词**（动词＋介词的固定搭配）：`put out the fire` → `extinguish the fire`；词典只批准极少数（`put on`、`come on`）。
- **9.4** 同一物、同一语境用同一说法，保持术语一致。
- GR（**建议，不是规则**）共 8 条：
  - GR-1：`that` 要写出来，不省略，译文也少歧义。
  - GR-2：`with` 只有三种批准用法（关联、伴随、工具），有歧义就重排句子。
  - GR-3：代词指代有歧义时改写成名词；`he`／`she` 不在词典里。
  - GR-4：`this` 不许指代不明，要把先行内容复写出来。
  - GR-5：防"假朋友"词（例：`disposition` 不是"指示"）。
  - GR-6：不用拉丁缩写 `e.g.`／`i.e.`／`etc.`，列举要写全。
  - GR-7：用无性别指向的表达。
  - GR-8：所有格慎用，不确定就改写成 `of` 结构。

## 情态与义务词（词典原文核对）

| 词 | 词典定义／处置 |
|----|----------------|
| MUST | "Auxiliary modal verb that shows obligation"，表义务 |
| DO NOT | 用祈使句表禁止（`DO NOT OPERATE…`） |
| CAN | 表可能、能够、被许可；不许用 could 表可能 |
| WILL | 表一般将来 |
| MAKE SURE | "To verify and/or do the necessary steps"（`ensure` 不批准 → `MAKE SURE`） |
| shall | 不批准 → MUST |
| should | 不批准 → MUST 或 IF |
| may | 不批准 → CAN 或 POSSIBLY |
| allow | 不批准 → LET |
| let | LET (v), LETS, LET |

**要点**：Issue 9 **没有** RFC 2119 那样的"建议（推荐但非强制）"档；`should` 被并进 `MUST`。限制靠 MUST／DO NOT，许可靠 CAN。

不批准 → 批准（取自 Issue 9 的 List of recurring errors 与 A–Z 词条，两处合并）：`acceptable`→PERMITTED、`avoid`→PREVENT、`both`→THE TWO、`check`(v)→CHECK(n)、`damage`(v)→DAMAGE(n)、`ensure`→MAKE SURE、`execute`／`perform`→DO、`fit`(v)→INSTALL、`follow`→OBEY、`further`→MORE、`however`→BUT、`insert`→PUT、`main`→PRIMARY、`obtain`→GET、`portion`→PART、`press`→PUSH、`proper`→CORRECT、`reach`→GET、`since`→BECAUSE、`test`(v)→TEST(n)、`utilize`→USE、`whilst`→WHILE、`under`→BELOW／IN／LESS THAN。

## STE 不管的范围（总引言核对）

缩写规则、文本排版与字体与编号方式、计量单位——**都不在 STE 条文里**。本 skill 的"缩略语给全称""数字与单位写法""绝对日期"这三类判据另有来源。它们取自社区中文移植规范与本仓库既有约定，**不要当作 ASD-STE100 条文引用**。

## 常被误挂到 STE100 名下、Issue 9 里实际不存在的内容

逐项核对，均"未找到"对应条文：不许用 `there is`／`there are`（`THERE` 反而是批准代词，且有 STE 例句）、不许用 `it is`、`in order to`、`used to`、`no later than` 的专门条目。

另有两条常见误传：没有针对 `please` 的规则；Issue 9 没有编号的 Principles 列表。

"警告必须写在危险步骤之前"这条属于 S1000D／ATA 100 这类出版物规范，不是 Issue 9 的编号规则。

## 中文移植现状

ASD／STEMG **没有官方中文版**，STE100 只有英语本。

社区有移植项目 Simplified Technical Chinese，仓库地址 github.com/mzopedia/simplified-technical-chinese。它自称"不是 ASD-STE100 的译本，与 ASD 没有关系"。其 40 条规则给出的量级：操作句 ≤ 30 字，描述句 ≤ 40 字。它禁 `进行`／`加以` 类名词化，要求列举闭合、时间用绝对日期。以上取自该项目 README 的检索摘要，**未逐条核对原文**。

本 skill 的中文判据采用同一量级。每条判据的来源（STE 条文／社区移植／本仓库约定）逐节标注在 `references/zh-adaptation.md`。
