#!/bin/sh

echo "容器启动 | 时间: $(date '+%Y-%m-%d %H:%M:%S') | 时区: $TZ"

# 检查环境变量
[ -z "$CHINA_UNICOM_SIGNIN_COOKIE" ] && echo "⚠️  CHINA_UNICOM_SIGNIN_COOKIE 未配置"
[ -z "$JUEJIN_COOKIE" ] && echo "⚠️  JUEJIN_COOKIE 未配置"
[ -z "$SERVERCHAN_KEY" ] && echo "⚠️  SERVERCHAN_KEY 未配置"

echo "定时任务: $(cat /etc/crontabs/root | grep -v '^#' | grep -v '^$')"
echo "Cron 已启动，日志输出到 /var/log/cron.log"

# 启动 cron 守护进程（前台运行，静默模式）
# -l 8: 只显示致命错误，屏蔽所有调试和常规日志
exec busybox crond -f -l 8 -c /etc/crontabs
