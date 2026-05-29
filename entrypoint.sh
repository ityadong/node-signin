#!/bin/sh

echo "=========================================="
echo "容器启动中..."
echo "当前时间: $(date)"
echo "时区设置: $TZ"
echo "=========================================="

# 检查环境变量是否配置
echo "检查环境变量配置..."
if [ -z "$CHINA_UNICOM_SIGNIN_COOKIE" ]; then
  echo "⚠️  警告: CHINA_UNICOM_SIGNIN_COOKIE 未配置"
fi

if [ -z "$JUEJIN_COOKIE" ]; then
  echo "⚠️  警告: JUEJIN_COOKIE 未配置"
fi

if [ -z "$SERVERCHAN_KEY" ]; then
  echo "⚠️  警告: SERVERCHAN_KEY 未配置"
fi

echo "=========================================="
echo "启动 cron 定时任务..."
echo "定时任务配置:"
cat /etc/crontabs/root
echo "=========================================="

# 启动 cron 守护进程（前台运行）
# 使用 busybox crond 并添加 -c 参数指定配置目录
# -l 0: 显示所有日志级别（包括任务输出）
exec busybox crond -f -l 0 -L /dev/stdout -c /etc/crontabs
