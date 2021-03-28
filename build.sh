#!/bin/bash -l
nvm use
PUBLIC_URL=https://meeply-designer.github.io/ npm run build
rm build/**/*.map
