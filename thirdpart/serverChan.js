// 加载 .env 文件
require("dotenv").config();
const axios = require("axios");

// 获取Server酱的key
const serverChanKey = process.env.SERVERCHAN_KEY;

// 新版Server酱推送
const sendServer = async (title, content) => {
  if (!serverChanKey) {
    console.log("模板消息发送失败，环境变量未配置：SERVERCHAN_KEY");
    return
  }
  const serverContent = { text: title, desp: content };
  const serverUrl = `https://sctapi.ftqq.com/${serverChanKey}.send`;
  // console.log("serverContent", serverContent);
  const { status } = await axios.post(serverUrl, serverContent);
  if (status == 200) {
    console.log(">>>新版Server酱消息推送成功");
  } else {
    console.log(">>>新版Server酱消息推送失败");
  }
};

module.exports = sendServer;
