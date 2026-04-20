#!/bin/bash

mkdir build-haiku
cd build-haiku
cmake ..
make -j10

rm -rf pkg

mkdir pkg
mkdir -p ./pkg/apps/
mkdir -p ./pkg/data/minecraftpe
mkdir -p ./pkg/settings/minecraftpe
mkdir -p ./pkg/data/deskbar/menu/Applications/
mkdir -p ./pkg/data/deskbar/menu/Games/

cp -rv ../project/haiku/pkg ./
cp -v MinecraftPE ./pkg/apps/minecraftpe
cp -v MinecraftPE-server ./pkg/apps/minecraftpe-server
cp -rv data ./pkg/data/minecraftpe

ln -s ../../../../apps/minecraftpe ./pkg/data/deskbar/menu/Applications/minecraftpe
ln -s ../../../../apps/minecraftpe ./pkg/data/deskbar/menu/Games/minecraftpe


package create -C pkg minecraftpe-0.6.1-x86_64.hpkg
