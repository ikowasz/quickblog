#!/bin/sh
rm -rf dist
mkdir dist
cp -rfv content/public/* dist

set -e

yarn --cwd tools/builder install
yarn --cwd tools/builder start
mv -v dist/blog.html dist/index.html
