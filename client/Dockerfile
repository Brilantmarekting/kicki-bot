# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY vite.config.ts tsconfig.json tsconfig.node.json components.json ./
COPY client ./client
COPY shared ./shared
RUN npm ci --legacy-peer-deps --ignore-scripts || npm install --legacy-peer-deps
RUN npx vite build

# Production stage with Brotli
FROM nginx:alpine
RUN apk add --no-cache brotli nginx-mod-http-brotli
COPY --from=builder /app/dist/public /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3002
CMD ["nginx", "-g", "daemon off;"]
