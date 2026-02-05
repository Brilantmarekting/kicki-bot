FROM node:20-alpine
WORKDIR /app

# Monorepo: los deps están en la raíz
COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY server ./server
COPY shared ./shared

# Instala deps (ignorando conflictos de peer deps)
RUN npm ci --legacy-peer-deps --ignore-scripts || npm install --legacy-peer-deps

# Construye SOLO el backend (sin vite build)
RUN cd server && npx esbuild index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

EXPOSE 3001
CMD ["node", "server/dist/index.js"]