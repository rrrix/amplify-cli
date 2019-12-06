#!/usr/bin/env bash
set -e
yarn global upgrade yarn@latest npm@latest
yarn global add lerna typescript eslint tslint jest
yarn config set workspaces-experimental true
yarn
yarn run cd-build
yarn run rm-cli-link
yarn run link-cli
yarn run link-caa

mkdir -vp .pip_cache
pip_install() {
  pip3 install --quiet --upgrade --compile --cache-dir .pip_cache --disable-pip-version-check --force-reinstall "$@"
}

pip_install awscli cfn-flip
