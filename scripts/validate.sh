#!/usr/bin/env bash
# 校验 skills/ 下每个技能的 SKILL.md：
#   - 有 frontmatter（--- 包裹）
#   - frontmatter 里有 name、description
#   - name 与目录名一致
#   - description 不超过 1024 字符
#   - 提示写死的个人路径（不判失败）
#
# 用法：bash scripts/validate.sh
set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_ROOT="$REPO_DIR/skills"

errors=0
warnings=0
count=0

fail() {
  printf '错误  %s\n' "$*" >&2
  errors=$((errors + 1))
}

notice() {
  printf '提示  %s\n' "$*"
  warnings=$((warnings + 1))
}

# 取 SKILL.md 首个 --- 块之间的内容。
frontmatter() {
  awk 'NR==1 { if ($0 != "---") exit; next } /^---$/ { exit } { print }' "$1"
}

# 取 frontmatter 里某个键的值，去掉成对引号。
value_of() {
  printf '%s\n' "$2" | sed -n "s/^$1:[[:space:]]*//p" | head -1 |
    sed 's/^"//; s/"$//; s/^'"'"'//; s/'"'"'$//'
}

shopt -s nullglob
for dir in "$SRC_ROOT"/*/; do
  name="$(basename "$dir")"
  file="$dir/SKILL.md"
  count=$((count + 1))

  if [ ! -f "$file" ]; then
    fail "${name}：缺少 SKILL.md"
    continue
  fi

  fm="$(frontmatter "$file")"
  if [ -z "$fm" ]; then
    fail "${name}：SKILL.md 没有 frontmatter"
    continue
  fi

  fm_name="$(value_of name "$fm")"
  desc="$(value_of description "$fm")"

  [ -n "$fm_name" ] || fail "${name}：frontmatter 缺 name"
  [ -n "$desc" ] || fail "${name}：frontmatter 缺 description"

  if [ -n "$fm_name" ] && [ "$fm_name" != "$name" ]; then
    fail "${name}：frontmatter name 是「$fm_name」，与目录名不一致"
  fi

  if [ -n "$desc" ] && [ "${#desc}" -gt 1024 ]; then
    fail "${name}：description 超过 1024 字符（${#desc}）"
  fi

  hits="$(grep -rnE '(/Users/|/home/)[A-Za-z0-9._-]+' "$dir" 2>/dev/null || true)"
  if [ -n "$hits" ]; then
    notice "${name}：写死了个人路径，换机器要改"
    printf '%s\n' "$hits" | sed 's/^/        /'
  fi
done
shopt -u nullglob

printf '\n检查 %d 个技能：%d 个错误，%d 条提示\n' "$count" "$errors" "$warnings"

if [ "$errors" -ne 0 ]; then
  exit 1
fi
