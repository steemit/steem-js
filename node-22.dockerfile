FROM node:22

# Set working directory
WORKDIR /steemjs

# Enable corepack for pnpm support
RUN corepack enable

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml* ./

# Remove node_modules if they exist
RUN rm -rf node_modules

# Install dependencies (frozen: lockfile/manifest drift fails the build
# instead of being silently re-resolved — Docker builds have no CI=true,
# so pnpm would not freeze automatically)
RUN pnpm install --frozen-lockfile --ignore-scripts || \
    (echo "PNPM install failed, retrying after store prune" && \
     pnpm store prune && \
     NODE_ENV=development pnpm install --frozen-lockfile --ignore-scripts)

# Copy the rest of the application
COPY . .

# Build the TypeScript/ESM project
RUN pnpm run build

# Debug environment
RUN echo "Node version: $(node -v)" && \
    echo "PNPM version: $(pnpm -v)" && \
    ls -la test

# Run tests (a failing test suite must fail the build)
RUN pnpm test

RUN echo "Build completed successfully!" 