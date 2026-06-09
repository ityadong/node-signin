const axios = require("axios");
const { isDebug, mask, debugLog } = require("./logger");

// 创建 axios 实例
const request = axios.create({
  timeout: 30000,
});

// 请求拦截器 - 调试日志（开启 DEBUG_HTTP 时生效）
request.interceptors.request.use(
  (config) => {
    if (isDebug()) {
      const method = (config.method || "get").toUpperCase();
      const url = config.url || "";
      const cookie = config.headers?.cookie || config.headers?.Cookie;
      debugLog("→ 请求", method, url);
      debugLog("  cookie:", mask(cookie));
      if (config.data !== undefined) {
        debugLog("  body:", config.data);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 统一错误处理
request.interceptors.response.use(
  (response) => {
    if (isDebug()) {
      debugLog("← 响应", response.status, response.config?.url || "");
      debugLog("  data:", response.data);
    }
    return response;
  },
  (error) => {
    // 统一处理错误，避免未捕获的异常
    const errorMessage = error.response
      ? `请求失败 [${error.response.status}]: ${error.response.statusText}`
      : error.message;

    console.log("✗ HTTP请求异常:", errorMessage);

    if (isDebug()) {
      debugLog("← 错误响应", error.response?.status || 0, error.config?.url || "");
      debugLog("  data:", error.response?.data || null);
    }

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
