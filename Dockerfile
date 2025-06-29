FROM node:22-alpine

# Install development tools
RUN apk add --no-cache \
    git \
    curl

# Set up working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Set default command
CMD ["npm", "run", "check"] 