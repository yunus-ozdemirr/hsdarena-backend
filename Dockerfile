# ---- build stage ----
FROM node:20-slim AS build
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build


# ---- runtime stage ----
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Install OpenSSL for runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl && rm -rf /var/lib/apt/lists/*

# Copy from build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

CMD ["node", "dist/src/main.js"]