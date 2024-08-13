const dotenv = require("dotenv");
const chalk = require("chalk"); // 控制台颜色
const fs = require("fs");
const { spawn } = require("child_process");

// 选择环境
const environment = process.env.ENVIRONMENT || "local"; // 默认为 local

// 加载相应的 .env 文件
const envFilePath = `.env.${environment}`;
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
} else {
  console.warn(`Environment file ${envFilePath} does not exist.`);
}

// 定义要运行的脚本文件
const scripts = [
  "./scripts/china-mobile/index.js",
  "./scripts/china-unicom/index.js",
  "./scripts/juejin/index.js",
];

// 按顺序执行脚本
function runScriptsSequentially(scripts, index = 0) {
  if (index >= scripts.length) {
    console.log(chalk.bold.greenBright("所有脚本执行完毕"));
    return;
  }

  const script = scripts[index];
  const child = spawn("node", [script], {
    stdio: "inherit", // 让子进程的输出继承父进程
    env: process.env, // 指定子进程的环境变量
  });

  child.on("spawn", () => {
    console.log(chalk.greenBright(`脚本${index + 1} ${script} 执行中...`));
  })

  child.on("error", (err) => {
    console.error(chalk.redBright(`启动 ${script} 时出错: ${err.message}`));
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(chalk.redBright(`${script} 以代码 ${code} 退出`));
    }
    // 运行下一个脚本
    runScriptsSequentially(scripts, index + 1);
  });
}

// 开始按顺序运行脚本
runScriptsSequentially(scripts);