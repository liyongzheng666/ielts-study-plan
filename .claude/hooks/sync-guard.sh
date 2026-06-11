#!/usr/bin/env bash
# 同步护栏（Stop hook）：assistant 一轮收尾时检查有没有忘记提交 / 推送。
# 只提醒，绝不自动 commit / push / 删除任何东西。
# 触发逻辑：工作区有未提交改动，或本地领先远端 → stderr 输出提醒 + exit 2（反馈给模型）。
# 配套规范见仓库根目录 CLAUDE.md 的「任务B」。
set -u

# 读取 hook 传入的 JSON（stdin）
input="$(cat 2>/dev/null || true)"

# 防循环：若本次 Stop 已是上一次 hook 触发后模型继续的结果，直接放行，避免无限阻塞
case "$input" in
  *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0 ;;
esac

# 定位项目根目录（优先用 harness 注入的 $CLAUDE_PROJECT_DIR）
dir="${CLAUDE_PROJECT_DIR:-}"
[ -z "$dir" ] && dir="$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)"
cd "$dir" 2>/dev/null || exit 0

# 不在 git 仓库内 → 安静退出
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# 工作区是否有未提交改动
dirty="$(git status --porcelain 2>/dev/null)"

# 有 upstream 才算"领先远端"；没设跟踪分支就只看工作区
ahead=0
if git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' >/dev/null 2>&1; then
  ahead="$(git rev-list --count '@{upstream}..HEAD' 2>/dev/null || echo 0)"
fi

if [ -n "$dirty" ] || [ "${ahead:-0}" != "0" ]; then
  n_dirty="$(printf '%s\n' "$dirty" | grep -c .)"
  {
    echo "同步护栏：检测到未提交/未推送改动（未提交文件 ${n_dirty} 个，本地领先远端 ${ahead} 个提交）。"
    echo "按 CLAUDE.md「任务B」执行：提交 → git push origin main → 验证 GitHub Pages。"
    echo "若用户已明确说先不推送，则忽略本提醒、直接停止。"
  } >&2
  exit 2
fi

exit 0
