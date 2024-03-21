import type { Options, RequestFailResult } from "@done-coding/request-base";
import {
  dispatchBusinessResult,
  InnerErrorCode,
  RequestFailResultBase,
  RequestFailResultNetwork,
  createDebugInfo,
  DebugLevelEnum,
  DebugStageEnum,
} from "@done-coding/request-base";
import { createRequest as createRequestBase } from "@done-coding/request-base";
import axios, { AxiosError } from "axios";
import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosInterceptorManager,
  AxiosRequestConfig,
  CreateAxiosDefaults,
} from "axios";
import _omit from "lodash/omit";
import _get from "lodash/get";
export * from "@done-coding/request-base";

export const createRequest = <S>({
  basePath,
  timeout,
  beforeRequest = (config) => config,
  instanceCreateConfig = {},
  ...otherOpt
}: Omit<Options<InternalAxiosRequestConfig, AxiosResponse<S>>, "issue"> & {
  beforeRequest?: Parameters<
    AxiosInterceptorManager<InternalAxiosRequestConfig>["use"]
  >[0];
  /** 示例创建选项 */
  instanceCreateConfig?: Omit<CreateAxiosDefaults, "baseURL" | "timeout">;
}) => {
  const instance = axios.create({
    baseURL: basePath,
    timeout,
    ...instanceCreateConfig,
  });

  const { debug } = otherOpt;

  instance.interceptors.request.use(beforeRequest, (error) => {
    debug &&
      createDebugInfo(
        {
          stage: DebugStageEnum.BEFORE_ERROR,
          data: error,
        },
        DebugLevelEnum.ERROR,
      );
    if (error instanceof RequestFailResultBase) {
      debug &&
        createDebugInfo(
          {
            stage: DebugStageEnum.BEFORE_ERROR_ORIGIN,
            data: error,
          },
          DebugLevelEnum.ERROR,
        );
      return Promise.reject(error);
    }
    const errorInfo: RequestFailResult = new RequestFailResultNetwork({
      code: InnerErrorCode.REQUEST_ERROR,
      message: "发起请求出错",
      cause: error,
    });

    debug &&
      createDebugInfo(
        {
          stage: DebugStageEnum.BEFORE_ERROR_PACK,
          data: errorInfo,
        },
        DebugLevelEnum.ERROR,
      );
    return Promise.reject(errorInfo);
  });

  const { request } = createRequestBase<AxiosRequestConfig, AxiosResponse<S>>({
    ...otherOpt,
    basePath,
    timeout,
    issue: ({ TIMEOUT, ...otherConfig }) => {
      return instance({
        timeout: TIMEOUT,
        ..._omit(otherConfig, ["BASE_PATH"]),
      })
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
          // https://www.axios-http.cn/docs/handling_errors
          const { response, request } = err as AxiosError;
          let code: RequestFailResult["code"];
          let message: string;
          if (response) {
            // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
            code = response.status;
            message = response.statusText;
          } else if (request) {
            // 请求已经成功发起，但没有收到响应
            code = InnerErrorCode.NO_RESPONSE;
            if (err instanceof AxiosError) {
              if (err.message.includes("timeout of")) {
                code = InnerErrorCode.NO_RESPONSE_TIMEOUT;
                message = "请求超时";
              } else if (_get(globalThis, "navigator.onLine") === false) {
                code = InnerErrorCode.NO_RESPONSE_OFFLINE;
                message = "网络未连接";
              } else {
                message = err.message;
              }
            } else {
              message = "未响应";
            }
          } else {
            // 发送请求时出了点问题
            code = InnerErrorCode.REQUEST_ERROR;
            message = "发起请求出错";
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
