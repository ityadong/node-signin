// 加载 .env 文件
require("dotenv").config();
const request = require("../utils/request");

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
  const response = await request.post(serverUrl, serverContent);

  // 检查是否是错误响应
  if (response.error) {
    console.log("✗ 新版Server酱消息推送失败:", response.message);
    return;
  }

  if (response.status == 200) {
    console.log("✓ 新版Server酱消息推送成功");
  } else {
    console.log("✗ 新版Server酱消息推送失败");
  }
};

module.exports = sendServer;
