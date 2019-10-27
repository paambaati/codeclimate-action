#!/bin/bash

set -e

# Check if we're on master first.
git_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$git_branch" == "master" ]; then
    echo "Cannot release from 'master' branch. Please checkout to a release branch!"
    echo "Example: git checkout -b v2-release"
    exit 1
fi

# Install dependencies and build & test.
DISABLE_OPENCOLLECTIVE=true HUSKY_SKIP_INSTALL=true npm install
npm test
npm run build

# Build & tests successful. Now keep only production deps.
npm prune --production

echo 1
# Remove Git hooks.
rm -rf .git/hooks/*
echo 2
# Force add built files and deps.
git add --force lib/ node_modules/
echo 3
git commit -a -m "Publishing $git_branch"
echo 4
git push -u origin $git_branch
echo 5

# Set up release tag.
read -p "Enter tag (example: v2.2.4) " git_tag
git push origin ":refs/tags/$git_tag"
git tag -fa "$git_tag" -m "Release $git_tag"
git push -u origin $git_tag
git push --tags

echo "Done!"
git_repo="$(git config --get remote.origin.url | cut -d ':' -f2 | sed "s/.git//")"
echo "You can now use this action with $git_repo@$git_tag"
