# Installation
```
# make sure you have node, npm, mongo installed
# make sure mongod is started
# make sure gulp is installed, or do
npm install -g gulp

# Install package, it would take a while
npm install

gulp init
# Semantic auto install is bugged
# So choose extend my settings > automatic manually when prompted

gulp build

# TODO: auto set mbox
cp judger/{mbox.c,Makefile} dist/judger
cd dist/judger
make
mkdir jail
cd ../..

# Run server
cd dist
node server.js
```
# Issue
Kindly submit any issue you found on github.
