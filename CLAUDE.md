# CLAUDE.md — 雅思学习工程 · 工作流规范

> 本文件会在每次会话自动加载。它是这个仓库的「标准作业流程（SOP）」。
> **当用户的指令含糊、只说了一半（例如只说"生成一篇记录"却没提同步），按本文件的完整流程补全并执行，并在动手前一句话说明你将补的步骤。**

## 这个工程是什么

- 一份雅思 9 个月自学计划 + 学习记录，同时是一个可浏览的**静态网页学习指南**。
- 远端仓库：`https://github.com/liyongzheng666/ielts-study-plan`（origin/main）。
- 线上网页：`https://liyongzheng666.github.io/ielts-study-plan/`，由 **GitHub Pages 从 main 分支根目录直接服务**（仓库根有 `.nojekyll` + `index.html`）。
- **关键事实：push 到 main = 自动部署网页。** 但网页的"学习记录"菜单是数据驱动的，**新增/改名记录必须手动维护 `assets/app.js`**，否则网页看不到。

## 目录地图

```
总计划/                 9 个月总览
月度计划/               各阶段逐月/逐日计划
学习模版/               成果模版（套这个产出学习记录）
  ├─ ielts-study-outcome-polar-bears.md   ← 主模版：一篇文章 = 7 类成果
  └─ ielts-study-outcome-example.md       ← Green Cities 样板
学习记录/第N个月/        每篇文章的学习记录（最终产物放这里）
index.html              网页入口
assets/app.js           网页逻辑 + 文档/记录菜单数据（studyRecords）
assets/style.css        样式
README.md               目录索引（含学习记录链接）
```

## 标准任务 A：根据材料生成一篇「学习记录」

1. **读模版** `学习模版/ielts-study-outcome-polar-bears.md`，照它的章节结构产出**7 类成果**：
   ① 精读同义替换批注（5–8 组）② 单词卡 6–8 张（Anki 格式）③ 同义替换组入总库
   ④ 句型库 2–3 个 ⑤ 30 秒复述（输出闭环）⑥ 配套题 + 逐题归因 ⑦ 写作 Task2 或口语范例 + 批注 ⑧ 总结。
2. **转录原文**：用户给的截图/文本是原始材料，先忠实转录到「〇、阅读原文」，再据此生成成果。
3. **放置位置**：`学习记录/第N个月/<按命名规范的文件名>.md`。
4. **若同篇被拆成多次精读**：用 `-part1 / -part2 …` 区分，并在文件头尾加双向交叉链接。

### 文件命名规范（已与用户确认）

格式：**`C{册号}-T{套号}-P{篇号}-{文章中文名}[-partN].md`**（编号在前，便于按教材排序检索）

- 例：`C16-T1-P1-北极熊-part1.md`、`C16-T1-P1-北极熊-part2.md`、`C17-T2-P3-睡眠.md`
- 册号用剑桥**册号**（C16），不是出版年份。
- **不要**再用「第N天 / 第N次学习」这类命名。

## 标准任务 B：每次改动后**必做**的同步（用户每次都要，别等他开口）

> 这是用户反复强调的部分：**改完仓库内容，就要同步 GitHub 仓库和静态网页。** 默认执行，除非用户明确说"先别推"。

1. **维护网页菜单**（新增/改名/删除记录时）：
   - 改 `assets/app.js` 的 `studyRecords`：在对应月份 `sessions` 数组里增改 `{ session, label, path }`。
     `label` = 菜单显示名（如 `"C16-T1-P1 北极熊 part1"`），`path` = 记录文件相对路径。
   - 改名记录时同步更新文件内/文件间的交叉链接。
   - `recordKey`（`rec-mX-sY`）、`.record-day` + `data-doc` 点击高亮链路**无需改**，只改数据。
2. **更新 `README.md`** 的「学习记录」链接（文案 + 路径）。
3. **自检**：
   - `node --check assets/app.js` → 必须通过。
   - `grep -rn "<旧文件名/旧命名>" --include=*.js --include=*.md --include=*.html .` → 无残留引用。
4. **提交并推送**：
   - 改名用 `git mv` 保留历史。
   - 单次提交，信息讲清"做了什么 + 为什么"，结尾带：
     `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
   - `git push origin main`。
5. **验证网页已同步**（push 后 Pages 约 1–2 分钟构建）：
   ```bash
   # 等构建完成
   gh api repos/liyongzheng666/ielts-study-plan/pages/builds/latest --jq '.status + " " + (.commit[0:7])'
   # built <短哈希> 后，验证 URL（中文路径要 urlencode）
   base="https://liyongzheng666.github.io/ielts-study-plan"
   enc(){ python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$1"; }
   curl -s -o /dev/null -w "%{http_code}\n" "$base/$(enc '学习记录/第一个月/<新文件>.md')"   # 期望 200
   ```
   - 新文件 URL → 200；被改名/删除的旧 URL → 404；必要时 grep 线上 `app.js` 确认 label 已更新。

## 提示词矫正约定（含糊时怎么办）

- 用户说"加一篇记录""把这个整理一下""更新一下"——默认 = **任务 A 全套 7 类成果 + 任务 B 全套同步推送验证**。
- 用户没说命名 → 按上面的命名规范自动定名（能从材料判断 C册/T套/P篇 就带上；判断不了就先问一句出处）。
- 用户没说"推送" → 仍然执行任务 B（这是默认约定）；只有用户明确说"先别推/只本地改"才跳过。
- 任何会改文件名/路径的操作，务必同时改 `app.js` + `README.md` + 交叉链接，保持三者一致。

## 提交 / 推送礼仪

- 只在完成且自检通过后提交；提交信息说明"做了什么 + 为什么"。
- 当前默认分支 `main`，网页直接吃 main，所以 push 前务必先跑完上面的自检与本地校验。
