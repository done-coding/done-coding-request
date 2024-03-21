import { createRequest } from "..";

export enum SceneUrlEnum {
  /** 请求前出错 */
  FAIL_BEFORE_REQUEST = "/get/fail/beforeRequest",
  /** 请求前超时 */
  FAIL_TIMEOUT = "/get/fail/beforeTimeout",
  /** 请求断网 */
  FAIL_OFFLINE = "/get/fail/beforeOffline",
  /** 请求前未响应 */
  FAIL_NO_RESPONSE = "/get/fail/noResponse",
  /** 请求成功但业务结构错误 */
  SUCCESS_MODEL_ERROR = "/get/success/modelError",
  /** 请求成功但业务失败 */
  SUCCESS_BUSINESS_FAIL = "/get/success/businessFail",
  /** 请求成功且业务成功 */
  SUCCESS_BUSINESS_SUCCESS = "/get/success/businessSuccess",
}

export const getRequest = (basePath: string, timeout = 1000) => {
  return createRequest<{
    code: number;
    data: any;
    message: string;
  }>({
    basePath,
    timeout,
    businessSuccessCodeList: [200],
    getBusinessCode: ({ data: { code } }) => {
      return code;
    },
    getBusinessData: ({ data: { data } }) => {
      return data;
    },
    getBusinessMsg: ({ data: { message } }) => {
      return message;
    },
    beforeRequest: (config) => {
      if (config.url === SceneUrlEnum.FAIL_BEFORE_REQUEST) {
        throw new Error("请求前出错测试");
      }
      return config;
    },
    dealError: (error) => {
      if (error.isBusinessError) {
        return {
          canShowErrorToast: true,
          newError: error,
        };
      } else {
        return {
          canShowErrorToast: true,
          newError: error,
        };
      }
    },
    showToast: (message, show) => {
      console.log(message, show);
    },
  });
};
