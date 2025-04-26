# Use a single stage for building and running for now
FROM node:20-alpine
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package manifests for relevant workspaces
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
# If frontend manifest is needed for shared types, uncomment below
# COPY frontend/package.json ./frontend/

# Install ALL dependencies from the lockfile for the entire workspace context
# This ensures devDependencies like typescript are available for the build step.
# Using --mount for caching pnpm store
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy the source code AFTER installing dependencies to leverage Docker cache
COPY shared ./shared
COPY backend ./backend
# If frontend source is needed for shared types, uncomment below
# COPY frontend ./frontend

# Build all workspace packages with a build script (including shared)
RUN pnpm -r run build

# Set the working directory for the runtime command
WORKDIR /app/backend

# Expose the port the backend listens on (adjust if different)
EXPOSE 3001

# Command to run the built application (relative to WORKDIR /app/backend)
# Correct path based on ls output: dist/backend/src/index.js
CMD ["node", "dist/backend/src/index.js"]
