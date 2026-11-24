# =============================================================================
# Campus Harmony — React + TanStack SSR / Client Frontend Dockerfile
# =============================================================================

FROM node:22-alpine
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy full frontend source
COPY . .

EXPOSE 5173

# Serve Vite dev/SSR development server bound to all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
