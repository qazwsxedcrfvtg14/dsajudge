# ADA Judge
https://ada18-judge.csie.org

# Original Project
https://github.com/bobogei81123/adajudge  
https://github.com/tzupengwang/adajudge

# Installation
```
# install nvm
# https://github.com/creationix/nvm

# install node
nvm install v10.10.0

# install yarn
# https://yarnpkg.com/lang/en/docs/install/#debian-stable

# install mongodb
sudo apt install mongodb

# install gulp and forever
yarn global add gulp forever

# add ~/.yarn/bin to PATH

# Install package, it would take a while
yarn

# Init
gulp init
# Semantic auto install is bugged
# So choose extend my settings > automatic manually when prompted

# Change src/server/config.js
# example: config.example.js

# Build
gulp build

# Build and copy isolate
sudo -H gulp isolate

# Unzip fonts.tar.gz in dist/static
tar xvf fonts.tar.gz dist/static/

# Link MathJax
ln -s ../../node_modules/mathjax/ dist/static/MathJax

# Run server
./start.sh

```
# Issue
Kindly submit any issue you found on github.
