# node-signin

<img src="public/images/msg.jpg" alt="微信消息提醒" width="375px">

## 介绍
* node-signin是一个执行日常签到任务的脚本，该项目仅用于学习和交流。
* 消息推送方案采用Server酱。

#### 目前主要功能

* 稀土掘金
    * 每日自动签到
    * 每日自动抽奖

* 中国联通
    * 每日自动签到

# 使用

本项目支持三种运行方式：

## 方式一：Docker 部署（推荐）

使用 Docker 镜像快速部署，支持定时任务自动执行。

### 本地部署

先构建镜像：

```bash
docker build -t node-signin:latest .
```

然后运行镜像：

```bash
docker run -d \
  --name node-signin \
  --restart unless-stopped \
  -e CHINA_UNICOM_SIGNIN_COOKIE="你的联通Cookie" \
  -e JUEJIN_APPEND_URL="你的掘金URL" \
  -e JUEJIN_COOKIE="你的掘金Cookie" \
  -e SERVERCHAN_KEY="你的Server酱Key" \
  -e TZ=Asia/Shanghai \
  node-signin:latest
```

### 或者直接使用本项目的镜像直接运行

```bash
docker run -d \
  --name node-signin \
  --restart unless-stopped \
  -e CHINA_UNICOM_SIGNIN_COOKIE="你的联通Cookie" \
  -e JUEJIN_APPEND_URL="你的掘金URL" \
  -e JUEJIN_COOKIE="你的掘金Cookie" \
  -e SERVERCHAN_KEY="你的Server酱Key" \
  -e TZ=Asia/Shanghai \
  registry.cn-hangzhou.aliyuncs.com/ityadong/node-signin:latest
```

### 本地使用 Docker Compose部署

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  node-signin:
    # 使用当前目录的 Dockerfile 构建镜像
    build: .
    restart: unless-stopped
    environment:
      - CHINA_UNICOM_SIGNIN_COOKIE=你的联通Cookie
      - JUEJIN_APPEND_URL=你的掘金URL
      - JUEJIN_COOKIE=你的掘金Cookie
      - SERVERCHAN_KEY=你的Server酱Key
      - TZ=Asia/Shanghai
    volumes:
      - ./logs:/var/log
```

启动容器：

```bash
docker compose up -d --build
```

### 查看日志

```bash
# 查看容器日志
docker logs -f node-signin

# 查看 cron 定时任务日志
docker exec node-signin cat /var/log/cron.log
```

### 定时任务说明

容器内已配置 cron 定时任务，默认每天早上 8:00 自动执行签到。

## 方式二：本地开发

将项目fork到自己的仓库。本项目使用环境变量来管理敏感信息和配置。为了方便本地开发，我们使用 `.env.local` 文件来存储这些变量。

### 安装项目依赖

在根目录运行以下命令

```
pnpm install
```

### 运行项目

本地运行
```
pnpm run start:local
```

## 方式三：GitHub Actions 手动运行

适合临时测试或手动触发签到任务。

1. 进入 GitHub 仓库页面
2. 点击 `Actions` 标签
3. 选择 `daily-node-task` 工作流
4. 点击 `Run workflow` 按钮
5. 选择分支后点击 `Run workflow` 执行

**注意**：GitHub Actions 服务器在国外，访问国内服务可能不稳定，建议使用 Docker 部署方式。

## 环境变量

### 1. 设置 `.env.local` 文件

在你第一次克隆项目并准备启动时，请执行以下步骤：

运行以下命令来自动生成 `.env.local` 文件：

```bash
pnpm run setup
```

### 2. 设置环境变量

- 本地运行的话，修改根目录下的.env.local文件
- 使用github actions可以实现定时任务，每天自动触发。在项目Settings => Secrets and variables => Actions下配置secrets即可。

| 环境变量名称 | 备注 |
| --- | --- |
| CHINA_UNICOM_SIGNIN_COOKIE | 中国联通签到的cookie |
| JUEJIN_APPEND_URL | 稀土掘金附加url，用于签到和抽奖 |
| JUEJIN_COOKIE | 稀土掘金的cookie |
| SERVERCHAN_KEY | server酱的key |

# 参数抓包截图

#### 掘金

![掘金相关参数](public/images/juejin.jpg)

# 相关工具

* 手机抓包工具
    * Stream

* Server酱
    * 「Server酱」，英文名「ServerChan」，它可以将服务器（或其他应用程序）产生的消息通过微信公众号推送给个人微信账号，实现消息的实时推送功能。
    * https://sct.ftqq.com/r/13293
