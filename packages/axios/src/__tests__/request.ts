import { createRequest } from "@/main";
import axios from "axios";

export enum SceneUrlEnum {
  /** 请求前出错 */
  FAIL_BEFORE_REQUEST = "/get/fail/beforeRequest",
  /** 请求前超时 */
  FAIL_TIMEOUT = "/get/fail/timeout",
  /** 请求断网 */
  FAIL_OFFLINE = "/get/fail/beforeOffline",
  /** 请求前未响应 */
  FAIL_NO_RESPONSE = "/get/fail/noResponse",
  /** 网络状态码 */
  FAIL_NETWORK_CODE_404 = "/get/fail/networkError/404",
  /** 请求成功但业务结构错误 */
  SUCCESS_MODEL_ERROR = "/get/success/modelError",
  /** 请求成功但业务失败 */
  SUCCESS_BUSINESS_FAIL = "/get/success/businessFail",
  /** 请求成功但业务失败且显示错误提示 */
  SUCCESS_BUSINESS_FAIL_SHOW_TOAST = "/get/success/businessFailShowToast",
  /** 请求成功且业务成功 */
  SUCCESS_BUSINESS_SUCCESS = "/get/success/businessSuccess",
  /** 失败静默重新请求 */
  FAIL_RELOAD = "/get/fail/reload",
}

export const getRequest = ({
  basePath = "",
  timeout = 1000,
  showToast,
  beforeError,
  beforeRequest,
}: {
  basePath?: string;
  timeout?: number;
  showToast?: (message: string) => void;
  beforeError?: Parameters<typeof createRequest>[0]["beforeError"];
  beforeRequest?: Parameters<typeof createRequest>[0]["beforeRequest"];
} = {}) => {
  return createRequest<{
    code: number;
    data: any;
    message: string;
  }>({
    basePath,
    timeout,
    businessSuccessCodeList: [200],
    getBusinessCode: ({ data }) => {
      return data.code;
    },
    getBusinessData: ({ data }) => {
      return data.data;
    },
    getBusinessMsg: ({ data }) => {
      return data.message;
    },
    beforeRequest,
    beforeError,
    showToast,
    uiConfig: {
      errorToast: true,
    },
    axios,
    instanceCreateConfig: { proxy: false },
  });
};
