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
import type { $Fetch, FetchContext } from "ofetch";
import _omit from "lodash/omit";
import type { FetchOptions, FetchResponse } from "./types";
export * from "@done-coding/request-base";

export interface XFetchOptions extends FetchOptions {
  url: string;
}

export interface XFetchResponse<S> extends FetchResponse<S> {
  data: S;
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
}: Omit<Options<XFetchOptions, XFetchResponse<S>>, "issue"> & {
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

  const { request } = createRequestBase<XFetchOptions, XFetchResponse<S>>({
    ...otherOpt,
    basePath,
    timeout,
    issue: ({ TIMEOUT, DEBUG: debug, url, ...otherConfig }) => {
      return instance(url, {
        timeout: TIMEOUT,
        ..._omit(otherConfig, ["BASE_PATH"]),
      })
        .then(
          (
            res: FetchContext & {
              response: FetchResponse<S>;
            },
          ) => {
            const { response } = res;

            return dispatchBusinessResult(
              {
                ...response,
                data: response._data,
              },
              otherOpt,
              debug,
            );
          },
        )
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
          if (response) {
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
