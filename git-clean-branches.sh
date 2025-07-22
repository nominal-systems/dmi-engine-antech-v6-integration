#!/usr/bin/env bash
# git-clean-branches.sh
# Verbose cleanup of local & remote branches merged into main.
# Usage: ./git-clean-branches.sh [--dry-run] [-h|--help]

set -euo pipefail

DRY_RUN=false

usage() {
  cat <<EOF
Usage: $(basename "$0") [--dry-run] [-h|--help]

Options:
  --dry-run     Show what would be deleted, without performing deletions.
  -h, --help    Display this help and exit.
EOF
}

# Parse options
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "❌ Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

# Ensure we're on main
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "main" ]]; then
  echo "❌ Please switch to 'main' before running this."
  exit 1
fi

echo "🔄 Fetching all remotes and pruning deleted ones…"
git fetch --all --prune

# Build merged_remote array without a subshell
declare -a merged_remote
while IFS= read -r branch; do
  merged_remote+=("$branch")
done < <(
  git branch -r --merged origin/main \
    | sed 's|^[ *]*origin/||' \
    | grep -vE '^(HEAD|main)$'
)

echo "Found ${#merged_remote[@]} remote branches merged into origin/main:"
for b in "${merged_remote[@]}"; do
  echo "  • $b"
done
echo

# Iterate over each local branch
git for-each-ref --format='%(refname:short)' refs/heads/ | while IFS= read -r local; do
  echo "🔍 Checking local branch '$local'…"
  if [[ "$local" == "main" ]]; then
    echo "  ↳ Skipping 'main'"
    continue
  fi

  # Check if local matches any merged remote
  matched=false
  for rb in "${merged_remote[@]}"; do
    if [[ "$local" == "$rb" ]]; then
      matched=true
      break
    fi
  done

  if $matched; then
    echo "  ✅ '$local' is merged into origin/main"
    if $DRY_RUN; then
      echo "    [DRY RUN] Would delete local: '$local'"
      echo "    [DRY RUN] Would delete remote: 'origin/$local'"
    else
      echo "    Deleting local branch '$local'…"
      git branch -d "$local"
      echo "    Deleting remote branch 'origin/$local'…"
      git push origin --delete "$local"
    fi
  else
    echo "  ⚠️  '$local' is NOT merged into origin/main → skipping"
  fi

  echo
done

echo "🎉 Done."
