# === 1. 构建阶段 (Builder) ===
FROM node:20-alpine AS builder

# 接收来自 docker-compose 的构建参数
ARG NEXT_PUBLIC_API_URL

# 设置环境变量，以便 'npm run build' 可以使用它
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm cache clean --force

COPY . .
# 确保环境变量被传入 build 过程
RUN npm run build


# === 2. 运行阶段 (Runner) ===
FROM node:20-alpine AS runner

WORKDIR /app

# 从构建阶段复制必要的产物
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/package.json ./package.json

# Install ONLY production dependencies based on package.json.
# The `--omit=dev` flag skips any packages listed in "devDependencies".
RUN npm install --omit=dev

# 只安装 serve 包


# 暴露端口
EXPOSE 3000

# 定义最终的、正确的启动命令
CMD ["npm", "start"]