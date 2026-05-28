# 使用官方 Node.js 镜像作为基础镜像
FROM node:24.16.0-alpine

# 安装 cron 和 tzdata（用于时区设置）
RUN apk add --no-cache tzdata dcron

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制项目文件
COPY . .

# 复制 crontab 配置
COPY crontab /etc/crontabs/root

# 设置时区为上海
ENV TZ=Asia/Shanghai

# 创建日志目录
RUN mkdir -p /var/log && touch /var/log/cron.log

# 赋予启动脚本执行权限
RUN chmod +x /app/entrypoint.sh

# 使用启动脚本
ENTRYPOINT ["/app/entrypoint.sh"]
