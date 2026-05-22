const axios = require("axios");
// 引入server酱
const sendServer = require("../../thirdpart/serverChan");

// 请求地址
const daySigninUrl = "https://activity.10010.com/sixPalaceGridTurntableLottery/signin/daySign";

// 获取 cookie 值
const cookieValue = process.env.CHINA_UNICOM_SIGNIN_COOKIE?.trim();

class UnicomSign {
  constructor(headers) {
    this.msgTitle = "中国联通签到";
    this.headers = headers;
    this.maxRetries = 3;
    this.timeout = 30000; // 30秒超时
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async daysign() {
    let lastError = null;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        console.log(`尝试第 ${i + 1} 次签到...`);

        const { data } = await axios.post(
          daySigninUrl,
          {},
          {
            headers: this.headers,
            timeout: this.timeout
          }
        );

        const { code, data: signData, desc } = data;
        if (code == "0000") {
          const { redSignMessage } = signData
          console.log("✓ 联通签到成功！", `抽奖奖励：${redSignMessage}`);
          sendServer(`${this.msgTitle}：成功`, `抽奖奖励：${redSignMessage}`);
          return;
        } else {
          console.log("✗ 联通签到失败！", desc);
          sendServer(`${this.msgTitle}：失败`, desc);
          return;
        }
      } catch (error) {
        lastError = error;
        const errorMsg = error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED'
          ? '连接超时'
          : error.message;

        console.log(`✗ 第 ${i + 1} 次尝试失败: ${errorMsg}`);

        if (i < this.maxRetries - 1) {
          const waitTime = (i + 1) * 2000; // 递增等待时间：2秒、4秒、6秒
          console.log(`等待 ${waitTime / 1000} 秒后重试...`);
          await this.sleep(waitTime);
        }
      }
    }

    // 所有重试都失败
    const finalErrorMsg = lastError?.code === 'ETIMEDOUT' || lastError?.code === 'ECONNABORTED'
      ? '网络连接超时，可能是 GitHub Actions 无法访问该服务'
      : lastError?.message || '未知错误';

    console.log(`✗ 联通签到失败，已重试 ${this.maxRetries} 次: ${finalErrorMsg}`);
    sendServer(`${this.msgTitle}：失败`, `重试 ${this.maxRetries} 次后仍然失败: ${finalErrorMsg}`);
  }
}

const headers = {
  "user-agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 unicom{version:iphone_c@11.0602}",
  referer: "https://img.client.10010.com",
  origin: "https://img.client.10010.com",
  "content-type": "application/x-www-form-urlencoded",
  cookie: cookieValue,
  accept: "application/json, text/plain, */*",
};

async function main() {
  if (cookieValue) {
    const unicom = new UnicomSign(headers);
    await unicom.daysign();
  } else {
    console.log("✗ 执行中断，环境变量未配置：CHINA_UNICOM_SIGNIN_COOKIE");
  }
}

main().catch(error => {
  console.error("✗ 联通签到执行出错:", error.message);
});