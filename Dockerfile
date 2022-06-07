#
# THTTPD
FROM alpine:3.14 AS thttpd_build

# Install all dependencies required for compiling thttpd
RUN apk add --no-cache gcc musl-dev make

# Initialize arguments and env
ARG THTTPD_VERSION=2.29
ARG THTTPD_SOURCE_URL=https://www.acme.com/software/thttpd/thttpd-${THTTPD_VERSION}.tar.gz

# Download and prepare thttpd sources
RUN wget -O /thttpd.tar.gz ${THTTPD_SOURCE_URL} \
    && mkdir /out \
    && tar xzf /thttpd.tar.gz -C /out \
    && mv /out/thttpd-${THTTPD_VERSION} /src \
    && rmdir /out

# Compile thttpd to a static binary which we can copy around
RUN cd /src \
  && ./configure \
  && make CCOPT='-O2 -s -static' thttpd \
  && mv /src/thttpd /thttpd


#
# BUILD
FROM node:18-alpine AS blog_build

# set working directory
WORKDIR /build

# prepare tools
COPY tools/archiver tools/archiver
COPY tools/builder tools/builder
RUN npm --prefix tools/builder install

# prepare content
COPY content content

# add date to all new posts
RUN npm --prefix tools/archiver start

# build blog
RUN npm --prefix tools/builder start

# create user
RUN adduser -D quickblog


#
# SERVER
FROM scratch AS server

# set user
COPY --from=blog_build /etc/passwd /etc/passwd
USER quickblog

# copy thttpd
COPY --from=thttpd_build /thttpd /thttpd

# set working directory
WORKDIR /public

# copy public data and blog page
COPY content/public .
COPY --from=blog_build /build/dist/blog.html index.html

# exposing port
EXPOSE 3000

# server start command
CMD ["/thttpd", "-D", "-p", "3000", "-d", "/public", "-u", "quickblog", "-l", "-", "-M", "3600"]