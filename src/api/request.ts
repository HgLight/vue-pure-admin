import axios from "axios";

import { ElNotification, ElMessageBox, ElMessage } from "element-plus";

const BASE_URL =
  "http://" +
  (process.env.NODE_ENV === "development-" ? "localhost" : "150.158.162.224");

const service = axios.create({
  baseURL: BASE_URL + ":1000",
  timeout: 50000
});

service.defaults.withCredentials = true; // 让ajax携带cookie
service.interceptors.request.use(
  // 每次请求都自动携带Cookie
  config => {
    //config.headers.Cookie = document.cookie

    return config;
  },
  // eslint-disable-next-line handle-callback-err
  error => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  rsp => {
    return rsp;
  },
  // 拦截异常的响应
  err => {
    console.log("请求", err);
    switch (err.response.status) {
      case 401:
        ElMessageBox.alert("登陆已过期，请关闭当前窗口重新进入-能臣工作台");
        break;
      case 403:
        ElMessage.warning("抱歉，您无权访问！");
        break;
      case 500:
        ElNotification.error({ title: "提醒", message: "服务器出了点小错误" });
        break;
      case 404:
        ElNotification({
          title: "提醒",
          message: "未找到，检查参数",
          type: "warning"
        });
        break;
      default:
        //throw 'request error'
        return Promise.reject(err);
    }
    //throw 'request error'
    return Promise.reject(err);
  }
);

export default service;
