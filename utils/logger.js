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
const logFile = path.join(logDir, "http-debug.log");

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

// 调试日志：打印到控制台；开启时同时追加到日志文件
const debugLog = (...args) => {
  if (!isDebug()) return;

  const line = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ");
  const stamped = `[${timestamp()}] ${line}`;

  console.log(chalk.gray(stamped));

  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, stamped + "\n");
  } catch (e) {
    console.log(chalk.yellow(`⚠️  写日志文件失败: ${e.message}`));
  }
};

module.exports = { isDebug, mask, debugLog };
