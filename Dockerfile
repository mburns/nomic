FROM alpine:3.18

# Install Lua and development tools
RUN apk add --no-cache \
    lua5.4 \
    lua5.4-dev \
    luarocks \
    git \
    gcc \
    libc-dev \
    make \
    curl \
    yaml-dev

# Set up working directory
WORKDIR /app

# Copy rockspec and install dependencies
COPY nomic-voting-1.0-1.rockspec ./
RUN luarocks install busted && \
    luarocks install luacov && \
    luarocks install luacheck && \
    luarocks install luafilesystem && \
    luarocks install lua-cjson && \
    luarocks install lyaml && \
    luarocks install luassert

# Install StyLua
RUN curl -L https://github.com/JohnnyMorganz/StyLua/releases/download/v0.18.0/stylua-linux-x86_64.zip -o stylua.zip && \
    unzip stylua.zip && \
    chmod +x stylua && \
    mv stylua /usr/local/bin/ && \
    rm stylua.zip

# Copy source code
COPY . .

# Set default command
CMD ["make", "check"] 