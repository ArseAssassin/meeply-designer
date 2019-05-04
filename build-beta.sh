#!/bin/bash -l
nvm use
PUBLIC_URL=https://meeply.net/beta/ npm run build
rm build/**/*.map
