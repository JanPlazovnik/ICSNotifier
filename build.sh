#!/bin/bash

# Copy all the files that `tsc` doesn't take care of
cp -R "./src/files" "./dist/files"
cp -R "./src/assets" "./dist/assets"

# Change the absolute path of the image
sed -i 's/src/dist/g' "./dist/index.js"