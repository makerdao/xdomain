#!/usr/bin/env bash
set -ex
cd "$(dirname "$0")"

cd ../repos/

cd dss-teleport
git checkout master
git pull
cd ..

echo "Dependencies bumped..."