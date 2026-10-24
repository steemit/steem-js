FROM node:22.23.4-alpine
#
# Pinned on purpose, do not float this back to `node:22`:
# - 22.23.4 is the first 22.x with the brotli decoder fix for CVE-2026-111497
#   (out-of-bounds write in the in-process brotli decoder, RCE). A floating tag
#   makes the CI node version depend on whatever `node:22` pointed at the last
#   time the runner's image cache was populated, which can silently be a
#   vulnerable build.
# - 22.23.4 is also the floor declared in package.json `engines`, so the CI
#   container tests exactly the oldest runtime consumers are allowed to use.

# Set working directory
WORKDIR /steemjs

# Enable corepack for pnpm support
RUN corepack enable

# Copy package files first for better caching.
# pnpm-workspace.yaml + patches/ are required at install time: the workspace
# file carries overrides/patchedDependencies, and frozen installs verify the
# patch file hash — without them the lockfile config check fails (and the
# overrides/patch would silently not apply at all).
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY patches/ patches/

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