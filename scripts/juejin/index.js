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

class JuejinSign {
  constructor(headers) {
    this.msgTitle = "掘金签到";
    this.headers = headers;
  }

  // 签到
  async checkIn() {
    const response = await request.post(
      checkInUrl,
      {},
      { headers: this.headers }
    );

    // 检查是否是错误响应
    if (response.error) {
      console.log(`✗ ${this.msgTitle}：请求失败`, response.message);
      await sendServer(`${this.msgTitle}：请求失败`, response.message);
      return;
    }

    const { data } = response;
    const { err_no, err_msg, data: juejinData } = data;
    if (err_no == 0) {
      const { incr_point } = juejinData;
      await this.lottery(incr_point);
    } else {
      console.log(`✗ ${this.msgTitle}：失败 [err_no=${err_no}]`, err_msg);
      await sendServer(`${this.msgTitle}：失败`, `[err_no=${err_no}] ${err_msg}`);
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
