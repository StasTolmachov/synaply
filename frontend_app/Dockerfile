# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies separately
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
# We must pass NEXT_PUBLIC_API_URL during build for client-side use
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy necessary files only
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

# Start server
CMD ["npm", "start"]
