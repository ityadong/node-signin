const request = require("../../utils/request");
// 引入server酱
const sendServer = require("../../thirdpart/serverChan");

// 获取 cookie 值
const cookieValue = process.env.JUEJIN_COOKIE?.trim();
const appendUrl = process.env.JUEJIN_APPEND_URL?.trim();

// 签到url
const checkInUrl = `https://api.juejin.cn/growth_api/v1/check_in?${ appendUrl }`;
// 抽奖url
const lotteryUrl = `https://api.juejin.cn/growth_api/v1/lottery/draw?${ appendUrl }`;

// 最大重连次数（首次失败后额外重试的次数）
const MAX_RETRIES = 3;
// 重连间隔（毫秒）
const RETRY_DELAY = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class JuejinSign {
  constructor(headers) {
    this.msgTitle = "掘金签到";
    this.headers = headers;
  }

  // 签到（失败自动重连，最多 MAX_RETRIES 次）
  async checkIn() {
    let lastFail = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        console.log(`↻ ${this.msgTitle}：第 ${attempt}/${MAX_RETRIES} 次重连...`);
        await sleep(RETRY_DELAY);
      }

      const response = await request.post(
        checkInUrl,
        {},
        { headers: this.headers }
      );

      // HTTP 层异常，记录后重试
      if (response.error) {
        lastFail = { title: `${this.msgTitle}：请求失败`, desp: response.message };
        console.log(`✗ ${lastFail.title}`, response.message);
        continue;
      }

      const { err_no, err_msg, data: juejinData } = response.data;

      // 签到成功，进入抽奖并结束
      if (err_no == 0) {
        const { incr_point } = juejinData;
        await this.lottery(incr_point);
        return;
      }

      // 业务失败，记录后重试
      lastFail = {
        title: `${this.msgTitle}：失败`,
        desp: `[err_no=${err_no}] ${err_msg}`,
      };
      console.log(`✗ ${lastFail.title} ${lastFail.desp}`);
    }

    // 重试耗尽仍失败，推送最后一次失败信息
    if (lastFail) {
      await sendServer(lastFail.title, `${lastFail.desp}（已重试 ${MAX_RETRIES} 次）`);
    }
  }

  // 抽奖
  async lottery(incr_point) {
    const response = await request.post(
      lotteryUrl,
      {},
      { headers: this.headers }
    );

    // 检查是否是错误响应
    if (response.error) {
      console.log("✗ 掘金抽奖请求失败！", response.message);
      await sendServer(`掘金抽奖：请求失败`, response.message);
      return;
    }

    const { data: axiosData } = response;
    const { err_no, err_msg, data } = axiosData;
    if (err_no == 0) {
      const { lottery_name } = data;
      const award = `签到奖励：${incr_point}矿石。
      抽奖奖励：${lottery_name}。`;
      if (lottery_name.indexOf('矿石') == -1) {
        await sendServer(`${this.msgTitle}：中奖咯`, award);
      } else {
        await sendServer(`${this.msgTitle}：成功`, award);
      }
    } else {
      console.log(`✗ 掘金抽奖失败！[err_no=${err_no}]`, err_msg);
      await sendServer(`掘金抽奖：失败`, `[err_no=${err_no}] ${err_msg}`);
    }
  }
}

const headers = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
  origin: "https://juejin.cn",
  referer: "https://juejin.cn/",
  "content-type": "application/json",
  cookie: cookieValue,
};

if (cookieValue) {
  const juejin = new JuejinSign(headers);
  juejin.checkIn();
} else {
  console.log("✗ 执行中断，环境变量未配置：JUEJIN_COOKIE、JUEJIN_APPEND_URL");
}
