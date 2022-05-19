#!/usr/bin/env bash
set -ex
cd "$(dirname "$0")"

cd ../repos/

cd dss-wormhole
git checkout master
git pull
cd ..

cd optimism-dai-bridge
git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*' # https://stackoverflow.com/questions/30800454/error-pathspec-test-branch-did-not-match-any-files-known-to-git
git fetch
git checkout kk/wormhole-bridge
git pull
cd ..

cd arbitrum-dai-bridge
git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*' # https://stackoverflow.com/questions/30800454/error-pathspec-test-branch-did-not-match-any-files-known-to-git
git fetch
git checkout wormhole-bridge
git pull
cd ..

echo "Dependencies bumped..."