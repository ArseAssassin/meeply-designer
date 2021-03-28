#!/bin/bash -l
nvm use
PUBLIC_URL=https://meeply.github.io/ npm run build
rm build/**/*.map
