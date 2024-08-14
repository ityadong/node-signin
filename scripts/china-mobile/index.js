const axios = require("axios");
const https = require("https");
// 由于中国移动的 https 证书有问题，所以使用自定义的HTTPS代理来处理SSL/TLS重新协商的问题
const agent = new https.Agent({
  secureOptions: require("constants").SSL_OP_LEGACY_SERVER_CONNECT,
});
// 引入server酱
const sendServer = require("../../thirdpart/serverChan");

// 初始化url
const initUrl = "https://h5.ha.chinamobile.com/h5-act/signIn/init";
// 签到url
const signinInfoUrl = "https://h5.ha.chinamobile.com/h5-act/signIn/click";

// 获取 cookie 值
const cookieValue = process.env.CHINA_MOBILE_SIGNIN_COOKIE;

class MobileSign {
  constructor(headers) {
    this.params = {
      channel: "channel_JTWD",
      recommend: "",
      optno: "",
      optcity: "",
      subchannel: "",
      appId: "",
    };
    this.msgTitle = "中国移动签到";
    this.headers = headers;
  }
  async init() {
    const { data: originalData } = await axios.post(initUrl, this.params, {
      headers: this.headers,
      httpsAgent: agent,
    });
    const { code, msg, data } = originalData;
    if (code == 1) {
      const { signToday } = data
      if (signToday == 1) {
        console.log(`${this.msgTitle}:失败`, '今日已经签过，请明天再来！');
        sendServer(`${this.msgTitle}:失败`, '今日已经签过，请明天再来！');
      } else {
        this.daysign();
      }
    } else {
      console.log(">>>init失败！", msg);
      sendServer(`${this.msgTitle}：失败`, msg);
    }
  }

  async daysign() {
    const { data } = await axios.post(signinInfoUrl, this.params, {
      headers: this.headers,
      httpsAgent: agent,
    });
    const { code, msg, data: repData } = data;
    // console.log("data", data);
    if (code == "1") {
      const { code: internalCode, msg: errMsg, prizeName } = repData;
      if (internalCode == "10") {
        console.log(`${this.msgTitle}:成功`, `奖品名称：${ prizeName }`);
        sendServer(`${this.msgTitle}:成功`, `奖品名称：${ prizeName }`);
      } else {
        console.log(`>>>${this.msgTitle}:失败`, errMsg);
        sendServer(`${this.msgTitle}:失败`, errMsg);
      }
    } else {
      console.log(">>>daysign失败！", msg);
      sendServer(`${this.msgTitle}：失败`, msg);
    }
  }
}

const headers = {
  host: "h5.ha.chinamobile.com",
  accept: 'application/json, text/plain, */*',
  origin: "http://h5.ha.chinamobile.com",
  referer:
    "https://h5.ha.chinamobile.com/hnmccClientWap/act_h5/html/h5/signNew/index?channel=channel_JTWD&WT.ac_id=240703_QD_JTWD&channelId=P00000015101&yx=1166345009",
  "content-type": "application/json",
  "user-agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/20A380 ChannelId(11) Ariver/1.0.15 leadeon/9.8.0/CMCCIT/tinyApplet RVKType(0) NebulaX/1.0.0/wkwebview leadeon/9.8.0/CMCCIT",
  cookie: cookieValue,
};

if (cookieValue) {
  const mobile = new MobileSign(headers);
  mobile.init();
} else {
  console.log("未配置环境变量 CHINA_MOBILE_SIGNIN_COOKIE");
}
