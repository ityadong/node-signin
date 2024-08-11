const axios = require("axios");
// 引入server酱
const sendServer = require("../../thirdpart/serverChan");

// 请求地址
const daySigninUrl = "https://activity.10010.com/sixPalaceGridTurntableLottery/signin/daySign";

// 获取 cookie 值
const cookieValue = process.env.CHINA_UNICOM_SIGNIN_COOKIE;

class UnicomSign {
  constructor(headers) {
    this.msgTitle = "中国联通签到";
    this.headers = headers;
  }
  async daysign() {
    const { data } = await axios.post(
      daySigninUrl,
      {},
      { headers: this.headers }
    );
    const { code, data: signData, desc } = data;
    if (code == "0000") {
      const { redSignMessage } = signData
      sendServer(`${this.msgTitle}：成功`, `抽奖奖励：${redSignMessage}`);
    } else {
      console.log(">>>签到失败！", desc);
      sendServer(`${this.msgTitle}：失败`, desc);
    }
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

if (cookieValue) {
  const unicom = new UnicomSign(headers);
  unicom.daysign();
} else {
  console.log("未配置环境变量：CHINA_UNICOM_SIGNIN_COOKIE");
}