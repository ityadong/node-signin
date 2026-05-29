const axios = require("axios");

// 创建 axios 实例
const request = axios.create({
  timeout: 30000,
});

// 响应拦截器 - 统一错误处理
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 统一处理错误，避免未捕获的异常
    const errorMessage = error.response
      ? `请求失败 [${error.response.status}]: ${error.response.statusText}`
      : error.message;

    console.log("✗ HTTP请求异常:", errorMessage);

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
