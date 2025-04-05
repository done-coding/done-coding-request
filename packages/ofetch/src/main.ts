import type { Options, RequestFailResult } from "@done-coding/request-base";
import {
  dispatchBusinessResult,
  InnerErrorCode,
  RequestFailResultBase,
  RequestFailResultNetwork,
  createDebugInfo,
  DebugLevelEnum,
  DebugStageEnum,
  resolveErrorMsg,
} from "@done-coding/request-base";
import { createRequest as createRequestBase } from "@done-coding/request-base";
import type { $Fetch } from "ofetch";
import _omit from "lodash.omit";
import _get from "lodash.get";
import type { FetchOptions } from "./types";
export * from "@done-coding/request-base";

export interface XFetchOptions extends FetchOptions {
  url: string;
}

export const createRequest = <S>({
  basePath,
  timeout,
  beforeRequest = (config) => config,
  networkSuccessCodeList,
  isSuccessNetworkCode = (code) =>
    Array.isArray(networkSuccessCodeList)
      ? networkSuccessCodeList.includes(code)
      : code >= 200 && code < 300,
  Fetch,
  instanceCreateConfig = {},
  ...otherOpt
}: Omit<Options<XFetchOptions, S>, "issue"> & {
  beforeRequest?: (
    config: XFetchOptions,
  ) => XFetchOptions | Promise<XFetchOptions>;
  /** 实例创建选项 */
  instanceCreateConfig?: Omit<
    FetchOptions,
    | "baseURL"
    | "timeout"
    | "onRequest"
    | "onRequestError"
    | "onResponse"
    | "onResponseError"
  >;
  /** 兼容nuxt 故构造函数外部传入 */
  Fetch: $Fetch;
}) => {
  const instance = Fetch.create({
    baseURL: basePath,
    timeout,
    ...instanceCreateConfig,
    onRequest: async (context) => {
      const { options: optionsInit, request } = context;
      const url = request as unknown as string;
      const options = await beforeRequest({
        ...optionsInit,
        url,
      });
      context.request = options.url;
      context.options = _omit(options, "url");
    },
    onResponseError: async (error) => {
      if (error instanceof RequestFailResultBase) {
        return Promise.reject(error);
      }
      const errorInfo: RequestFailResult = new RequestFailResultNetwork({
        code: InnerErrorCode.REQUEST_ERROR,
        message: resolveErrorMsg(error) ?? "发起请求出错",
        cause: error,
      });

      return Promise.reject(errorInfo);
    },
    onResponse: async (context) => {
      const { response } = context;
      const code = response.status;
      if (!isSuccessNetworkCode(code)) {
        throw context;
      }
    },
    // onRequestError: async (context) => {},
  });

  const { request } = createRequestBase<XFetchOptions, S>({
    ...otherOpt,
    basePath,
    timeout,
    issue: ({ TIMEOUT, DEBUG: debug, url, ...otherConfig }) => {
      const requestOptions: FetchOptions = {
        timeout: TIMEOUT,
        ..._omit(otherConfig, ["BASE_PATH"]),
      };
      /** 请求开始时间 */
      const requestTimeStart = Date.now();
      return instance(url, requestOptions)
        .then((res) => dispatchBusinessResult(res, otherOpt, debug))
        .catch((err) => {
          if (err instanceof RequestFailResultBase) {
            debug &&
              createDebugInfo(
                {
                  stage: DebugStageEnum.NETWORK_ERROR_ORIGIN,
                  data: err,
                },
                DebugLevelEnum.ERROR,
              );
            return Promise.reject(err);
          }
          const { response, request } = err;
          let code: RequestFailResult["code"];
          let message: string;
          /** 请求结束时间 */
          const requestTimeEnd = Date.now();
          /** 请求耗时 */
          const requestTime = requestTimeEnd - requestTimeStart;
          // 请求超时-情况1
          if ((err.message || "").toLowerCase().includes("timeout")) {
            code = InnerErrorCode.NO_RESPONSE_TIMEOUT;
            message = "请求超时";
            // 请求超时-情况2
          } else if (
            ["FetchError", "AbortError"].includes(err.name) &&
            requestTime > (requestOptions.timeout || TIMEOUT)
          ) {
            code = InnerErrorCode.NO_RESPONSE_TIMEOUT;
            message = "请求超时";
            // 网络未连接
          } else if (_get(globalThis, "navigator.onLine") === false) {
            code = InnerErrorCode.NO_RESPONSE_OFFLINE;
            message = "网络未连接";
          } else if (response) {
            // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
            code = response.status;
            message = response.statusText;
          } else if (request) {
            // 请求已经成功发起，但没有收到响应
            code = InnerErrorCode.NO_RESPONSE;
            message = resolveErrorMsg(err) ?? "未响应";
          } else {
            // 发送请求时出了点问题
            code = InnerErrorCode.REQUEST_ERROR;
            message = resolveErrorMsg(err) ?? "发起请求出错";
          }
          const errorInfo: RequestFailResult = new RequestFailResultNetwork({
            code,
            message,
            cause: err,
          });
          debug &&
            createDebugInfo(
              {
                stage: DebugStageEnum.NETWORK_ERROR_PACK,
                data: errorInfo,
              },
              DebugLevelEnum.ERROR,
            );
          return Promise.reject(errorInfo);
        });
    },
  });

  return request;
};
