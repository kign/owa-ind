#! /bin/bash -u

cd "$( dirname "${BASH_SOURCE[0]}" )"
cd ..

type svgtopng.sh >/dev/null 2>&1 || { echo >&2 "svgtopng.sh not installed.  Aborting."; exit 1; }

mkdir -p ext/icons
svgtopng.sh -g 128,128 assets/outlook.svg ext/icons/icon_128.png
svgtopng.sh -g 128,128 assets/outlook_red.svg ext/icons/icon_128_red.png
svgtopng.sh -g 128,128 assets/outlook_yellow.svg ext/icons/icon_128_yellow.png
