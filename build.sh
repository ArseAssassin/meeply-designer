#!/bin/bash -l
nvm use
PUBLIC_URL=https://meeply.net/ npm run build
rm build/**/*.map
