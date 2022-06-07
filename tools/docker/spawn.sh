#!/bin/sh
docker build -t quickblog:latest .
docker run -it --rm -p 3000:3000 quickblog:latest
