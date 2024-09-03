const axios = require("axios");
// 引入server酱
const sendServer = require("../../thirdpart/serverChan");

// 获取 cookie 值
const cookieValue = process.env.JUEJIN_COOKIE;
const appendUrl = process.env.JUEJIN_APPEND_URL;

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
    const { data } = await axios.post(
      checkInUrl,
      {},
      { headers: this.headers }
    );
    const { err_no, err_msg, data: juejinData } = data;
    if (err_no == 0) {
      const { incr_point } = juejinData;
      this.lottery(incr_point);
    } else {
      console.log(">>>签到失败！", err_msg);
      sendServer(`${this.msgTitle}：失败`, err_msg);
    }
  }

  // 抽奖
  async lottery(incr_point) {
    const { data: axiosData } = await axios.post(
      lotteryUrl,
      {},
      { headers: this.headers }
    );
    const { err_no, err_msg, data } = axiosData;
    if (err_no == 0) {
      const { lottery_name } = data;
      const award = `签到奖励：${incr_point}矿石。
      抽奖奖励：${lottery_name}。`;
      if (lottery_name.indexOf('矿石') == -1) {
        sendServer(`${this.msgTitle}：中奖咯`, award);
      } else {
        sendServer(`${this.msgTitle}：成功`, award);
      }
    } else {
      console.log(">>>抽奖失败！", err_msg);
      sendServer(`掘金抽奖：失败`, err_msg);
    }
  }
}

const headers = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  origin: "https://juejin.cn",
  referer: "https://juejin.cn/",
  "content-type": "application/json",
  cookie: cookieValue,
};

if (cookieValue) {
  const juejin = new JuejinSign(headers);
  juejin.checkIn();
} else {
  console.log("执行中断，环境变量未配置：JUEJIN_COOKIE、JUEJIN_APPEND_URL");
}
