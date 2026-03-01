FROM node:22-alpine AS base
WORKDIR /app

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/package.json shared/package.json

RUN npm install

COPY backend backend
COPY frontend frontend
COPY shared shared
COPY specs specs

RUN npm run build -ws

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/quiz.db
EXPOSE 3000

COPY --from=base /app/backend/dist ./backend/dist
COPY --from=base /app/backend/package.json ./backend/package.json
COPY --from=base /app/node_modules ./node_modules

RUN addgroup -S app && adduser -S app -G app
USER app

CMD ["node", "backend/dist/server.js"]
