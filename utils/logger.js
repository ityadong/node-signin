const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

// 调试开关：DEBUG_HTTP=true 或 1 时开启
const isDebug = () => {
  const v = process.env.DEBUG_HTTP;
  return v === "true" || v === "1";
};

// 日志目录与文件
const logDir = process.env.LOG_DIR || "./logs";
const logFile = path.join(logDir, "http.log");

// 日志轮转配置
// LOG_MAX_SIZE：单文件大小上限（字节），默认 5MB；超过则轮转
// LOG_MAX_FILES：保留的历史文件数（http.log.1 ~ http.log.N），默认 3
const maxSize = Number(process.env.LOG_MAX_SIZE) || 5 * 1024 * 1024;
const maxFiles = Number(process.env.LOG_MAX_FILES) || 3;

// 本地时间戳（容器已设 TZ=Asia/Shanghai）
const timestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// 敏感串脱敏：只显示长度和首尾几位，绝不输出明文
const mask = (value) => {
  if (!value) return "(empty)";
  const str = String(value);
  if (str.length <= 12) return `len=${str.length} (***)`;
  return `len=${str.length} (${str.slice(0, 8)}...${str.slice(-4)})`;
};

// 按大小轮转：当前文件超过上限时，依次后移
// http.log.(N-1) → http.log.N，… ，http.log.1 → http.log.2，http.log → http.log.1
const rotateIfNeeded = () => {
  try {
    const { size } = fs.statSync(logFile);
    if (size < maxSize) return;
  } catch (e) {
    // 文件不存在等情况：无需轮转
    return;
  }

  try {
    // 删除最老的一份
    const oldest = `${logFile}.${maxFiles}`;
    if (fs.existsSync(oldest)) fs.rmSync(oldest);

    // 历史文件依次后移
    for (let i = maxFiles - 1; i >= 1; i--) {
      const src = `${logFile}.${i}`;
      if (fs.existsSync(src)) fs.renameSync(src, `${logFile}.${i + 1}`);
    }

    // 当前文件 → http.log.1
    fs.renameSync(logFile, `${logFile}.1`);
  } catch (e) {
    console.log(chalk.yellow(`⚠️  日志轮转失败: ${e.message}`));
  }
};

// HTTP 日志：始终写入日志文件（成功/失败都记）；
// 仅当 DEBUG_HTTP 开启时，额外在控制台打印。
const httpLog = (...args) => {
  const line = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ");
  const stamped = `[${timestamp()}] ${line}`;

  // 控制台输出：只在调试开关开启时打印，避免 cron 正常运行时刷屏
  if (isDebug()) {
    console.log(chalk.gray(stamped));
  }

  // 文件输出：始终记录，便于事后排查
  try {
    fs.mkdirSync(logDir, { recursive: true });
    rotateIfNeeded();
    fs.appendFileSync(logFile, stamped + "\n");
  } catch (e) {
    console.log(chalk.yellow(`⚠️  写日志文件失败: ${e.message}`));
  }
};

// 兼容旧调用名
const debugLog = httpLog;

module.exports = { isDebug, mask, httpLog, debugLog };
