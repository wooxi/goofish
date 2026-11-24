FROM node:22-alpine
RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY package.json package-lock.json ./
RUN npm ci --include=dev --registry=https://registry.npmmirror.com

COPY . .
RUN mkdir -p /app/data /app/logs /app/public/uploads && npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "rm -rf .next/build && npx prisma generate && npx prisma db push --skip-generate && npm run build && npm run start"]
