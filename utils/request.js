const axios = require("axios");
const { mask, httpLog } = require("./logger");

// 创建 axios 实例
const request = axios.create({
  timeout: 30000,
});

// 请求拦截器 - 始终记录请求日志（cookie 脱敏）
request.interceptors.request.use(
  (config) => {
    const method = (config.method || "get").toUpperCase();
    const url = config.url || "";
    const cookie = config.headers?.cookie || config.headers?.Cookie;
    httpLog("→ 请求", method, url);
    httpLog("  cookie:", mask(cookie));
    if (config.data !== undefined) {
      httpLog("  body:", config.data);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 始终记录响应日志，并统一错误处理
request.interceptors.response.use(
  (response) => {
    httpLog("← 响应", response.status, response.config?.url || "");
    httpLog("  data:", response.data);
    return response;
  },
  (error) => {
    // 统一处理错误，避免未捕获的异常
    const errorMessage = error.response
      ? `请求失败 [${error.response.status}]: ${error.response.statusText}`
      : error.message;

    console.log("✗ HTTP请求异常:", errorMessage);

    httpLog("← 错误响应", error.response?.status || 0, error.config?.url || "");
    httpLog("  data:", error.response?.data || null);

    // 返回一个包含错误信息的对象，而不是抛出异常
    return Promise.resolve({
      error: true,
      status: error.response?.status || 0,
      message: errorMessage,
      data: error.response?.data || null
    });
  }
);

module.exports = request;
