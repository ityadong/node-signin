# Docker 部署方案

## 架构流程

```
本地开发 → Push to GitHub → GitHub Actions 构建镜像 → 
推送到阿里云镜像仓库 → 触发 Portainer Webhook → 
Portainer 拉取新镜像并重新部署
```

## 一、环境变量管理

### 本地开发环境
- 文件：`.env.local`
- 命令：`npm run start:local`
- 读取方式：dotenv 自动加载

### 服务器生产环境
- 在 Portainer Stack/Container 中手动配置（一次性）
- 需要配置的环境变量：
  - `CHINA_UNICOM_SIGNIN_COOKIE`
  - `JUEJIN_APPEND_URL`
  - `JUEJIN_COOKIE`
  - `SERVERCHAN_KEY`

## 二、需要创建的文件

- [x] `Dockerfile` - Docker 镜像构建文件
- [x] `.dockerignore` - Docker 构建忽略文件
- [x] `crontab` - 定时任务配置
- [x] `entrypoint.sh` - 容器启动脚本
- [x] `.github/workflows/deploy.yml` - 自动部署工作流

## 三、阿里云镜像仓库配置

### 需要填写的信息（请修改）

```yaml
# 阿里云镜像仓库地址（例如：registry.cn-hangzhou.aliyuncs.com）
ALIYUN_REGISTRY_URL: registry.cn-hangzhou.aliyuncs.com

# 命名空间（例如：your-namespace）
ALIYUN_NAMESPACE: ityadong

# 镜像名称
IMAGE_NAME: node-signin

# 完整镜像地址示例
# registry.cn-hangzhou.aliyuncs.com/your-namespace/node-signin:latest
```

## 四、Github Actions示例
```
name: CI/CD Pipeline

on:
  # 设置可手动运行该工作流
  workflow_dispatch:
  # push到指定分支才运行工作流
  push:
    branches:
      - feature/docker-deploy   # 分支 push 时触发

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      # 1.
      - name: 拉取代码
        uses: actions/checkout@v3

      # 2.
      - name: 登录阿里云镜像仓库
        uses: docker/login-action@v2
        with:
          registry: registry.cn-hangzhou.aliyuncs.com
          username: ${{ secrets.ALIYUN_DOCKER_USERNAME }}
          password: ${{ secrets.ALIYUN_DOCKER_PASSWORD }}

      # 3.
      - name: 构建 Docker 镜像
        run: |
          docker build -t registry.cn-hangzhou.aliyuncs.com/ityadong/node-signin:latest -f Dockerfile .

      # 4.
      - name: 推送镜像到阿里云镜像仓库
        run: |
          docker push registry.cn-hangzhou.aliyuncs.com/ityadong/node-signin:latest

      # 5. 触发 Portainer Webhook 自动部署
      - name: 触发 Portainer Webhook 部署
        run: |
          echo "🚀 正在通过 Portainer Webhook 触发部署..."

          response=$(curl -X POST "${{ secrets.PORTAINER_WEBHOOK_URL }}" \
            -H "User-Agent: GitHub-Actions-Deployer" \
            -w "\nHTTP_STATUS:%{http_code}" \
            -s)

          http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
          title="node-signin服务部署"

          if [ "$http_status" = "200" ] || [ "$http_status" = "204" ]; then
            body="✅成功"
            echo "✅ Webhook 调用成功！Portainer 正在自动拉取镜像并重启容器"
          else
            body="❌失败"
            echo "❌ Webhook 调用失败，HTTP 状态码: $http_status"
            echo "响应内容: $response"
          fi

          # 使用 Bark 推送部署结果通知
          curl -G "https://api.day.app/${{ secrets.BARK_KEY }}/${title}/${body}" \
            --data-urlencode "group=CI/CD" \
            --data-urlencode "icon=https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"

          # 如果失败则最后退出
          if [ "$body" = "失败" ]; then
            exit 1
          fi
```

## 五、定时任务配置

### 当前配置（可修改 crontab 文件）

```cron
# 每天早上 8:00 执行签到任务
0 8 * * * cd /app && node app.js >> /var/log/cron.log 2>&1
```

### Cron 时间格式说明

```
分 时 日 月 周
*  *  *  *  *
```

示例：
- `0 8 * * *` - 每天 8:00
- `0 9,18 * * *` - 每天 9:00 和 18:00
- `0 */6 * * *` - 每 6 小时执行一次

## 六、Portainer 配置步骤

### 1. 创建 Stack

在 Portainer 中创建新的 Stack，使用以下配置：

```yaml
version: '3.8'

services:
  node-signin:
    image: registry.cn-hangzhou.aliyuncs.com/your-namespace/node-signin:latest
    container_name: node-signin
    restart: unless-stopped
    environment:
      - CHINA_UNICOM_SIGNIN_COOKIE=${CHINA_UNICOM_SIGNIN_COOKIE}
      - JUEJIN_APPEND_URL=${JUEJIN_APPEND_URL}
      - JUEJIN_COOKIE=${JUEJIN_COOKIE}
      - SERVERCHAN_KEY=${SERVERCHAN_KEY}
      - TZ=Asia/Shanghai
    volumes:
      - ./logs:/var/log
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 2. 配置镜像仓库认证

在 Portainer 中添加阿里云镜像仓库：
- `Registries → Add registry`
- 类型：Custom
- Registry URL：`registry.cn-hangzhou.aliyuncs.com`
- 用户名和密码：阿里云凭证

### 3. 启用 Webhook

1. 进入 Stack 详情页
2. 找到 Webhook 部分
3. 点击 "Create webhook"
4. 复制生成的 Webhook URL
5. 将 URL 添加到 GitHub Secrets 中的 `PORTAINER_WEBHOOK_URL`

## 七、部署流程

### 首次部署

1. 完成上述所有配置
2. 推送代码到 `feature/docker-deploy` 分支
3. GitHub Actions 自动构建并推送镜像
4. 手动在 Portainer 中创建 Stack 并启动容器

### 后续更新

1. 修改代码并推送到 `feature/docker-deploy` 分支
2. GitHub Actions 自动构建新镜像
3. 自动触发 Portainer Webhook
4. Portainer 自动拉取新镜像并重启容器

## 八、验证和测试

### 本地测试 Docker 镜像

```bash
# 构建镜像
docker build -t node-signin:test .

# 运行容器（测试）
docker run --rm \
  -e CHINA_UNICOM_SIGNIN_COOKIE="your-cookie" \
  -e JUEJIN_APPEND_URL="your-url" \
  -e JUEJIN_COOKIE="your-cookie" \
  -e SERVERCHAN_KEY="your-key" \
  node-signin:test

# 查看日志
docker logs -f node-signin
```

### 查看服务器容器日志

```bash
# 在服务器上
docker logs -f node-signin

# 或在 Portainer 中查看 Container logs
```

## 九、故障排查

### 问题 1：GitHub Actions 构建失败
- 检查 GitHub Secrets 是否配置正确
- 检查阿里云镜像仓库凭证是否有效

### 问题 2：Portainer 无法拉取镜像
- 检查 Portainer 中的 Registry 配置
- 确认镜像地址和标签正确

### 问题 3：定时任务未执行
- 进入容器查看 cron 日志：`docker exec node-signin cat /var/log/cron.log`
- 检查容器时区设置：`docker exec node-signin date`

### 问题 4：环境变量未生效
- 检查 Portainer Stack 中的环境变量配置
- 重启容器使环境变量生效

## 十、注意事项

1. **时区设置**：容器内已设置为 `Asia/Shanghai`，确保定时任务按北京时间执行
2. **日志管理**：配置了日志轮转，最多保留 3 个 10MB 的日志文件
3. **安全性**：
   - 阿里云镜像仓库建议设置为私有
   - Portainer Webhook URL 不要泄露
   - 环境变量中的敏感信息不要提交到代码仓库
4. **更新频率**：每次推送到 master 都会触发部署，建议使用分支开发，合并后再部署

## 十一、后续优化建议

- [ ] 添加健康检查（health check）
- [ ] 配置告警通知（部署失败时通知）
- [ ] 添加多环境支持（dev/staging/prod）
- [ ] 使用 Docker Compose 管理多个服务
