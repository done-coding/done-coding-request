import type { Options, RequestFailResult } from "@done-coding/request-base";
import {
  dispatchBusinessResult,
  createHttpError,
  InnerErrorCode,
  RequestFailResultBase,
  RequestFailResultNetwork,
  createDebugInfo,
  DebugLevelEnum,
  DebugStageEnum,
  resolveErrorMsg,
} from "@done-coding/request-base";
import { createRequest as createRequestBase } from "@done-coding/request-base";
import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosInterceptorManager,
  CreateAxiosDefaults,
  AxiosRequestConfig,
  AxiosStatic,
} from "axios";
import _omit from "lodash.omit";
import _get from "lodash.get";
export * from "@done-coding/request-base";

export const createRequest = <S>({
  basePath,
  timeout,
  beforeRequest = (config) => config,
  networkSuccessCodeList,
  isSuccessNetworkCode = (code) =>
    Array.isArray(networkSuccessCodeList)
      ? networkSuccessCodeList.includes(code)
      : code >= 200 && code < 300,
  instanceCreateConfig = {},
  axios,
  ...otherOpt
}: Omit<Options<AxiosRequestConfig, AxiosResponse<S>>, "issue"> & {
  beforeRequest?: Parameters<
    AxiosInterceptorManager<InternalAxiosRequestConfig>["use"]
  >[0];
  /** 实例创建选项 */
  instanceCreateConfig?: Omit<
    CreateAxiosDefaults,
    "baseURL" | "timeout" | "validateStatus"
  >;
  /** 考虑@nuxtjs/axios axios外传 */
  axios: AxiosStatic;
}) => {
  const instance = axios.create({
    baseURL: basePath,
    timeout,
    ...instanceCreateConfig,
    validateStatus: isSuccessNetworkCode,
  });

  instance.interceptors.request.use(beforeRequest, (error) => {
    if (error instanceof RequestFailResultBase) {
      return Promise.reject(error);
    }
    const errorInfo: RequestFailResult = new RequestFailResultNetwork({
      code: InnerErrorCode.REQUEST_ERROR,
      message: resolveErrorMsg(error) ?? "发起请求出错",
      cause: error,
    });

    return Promise.reject(errorInfo);
  });

  const { request } = createRequestBase<AxiosRequestConfig, AxiosResponse<S>>({
    ...otherOpt,
    basePath,
    timeout,
    issue: ({ TIMEOUT, DEBUG: debug, ...otherConfig }) => {
      return instance({
        timeout: TIMEOUT,
        ..._omit(otherConfig, ["BASE_PATH"]),
      })
        .then((res) =>
          dispatchBusinessResult(
            res,
            {
              ...otherOpt,
              responseMetadata: {
                status: res.status,
                statusText: res.statusText ?? "",
                headers: res.headers,
              },
            },
            debug,
          ),
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
          // https://www.axios-http.cn/docs/handling_errors
          const { response, request } = err;
          let code: RequestFailResult["code"];
          let message: string;
          if (response) {
            // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
            return Promise.reject(
              createHttpError({
                response: {
                  status: response.status,
                  statusText: response.statusText ?? "",
                  body: response.data,
                },
                options: otherOpt,
                toBusinessResponse: (body) => ({
                  ...response,
                  data: body as S,
                }),
                cause: err,
              }),
            );
          } else if (request) {
            // 请求已经成功发起，但没有收到响应
            code = InnerErrorCode.NO_RESPONSE;
            if (axios.isAxiosError(err)) {
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
              message = resolveErrorMsg(err) ?? "未响应";
            }
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
