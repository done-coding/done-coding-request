import type { Options, RequestFailResult } from "@done-coding/request-base";
import {
  dispatchBusinessResult,
  InnerErrorCode,
  callback2Promise,
  RequestFailResultNetwork,
  RequestFailResultBase,
  createDebugInfo,
  DebugLevelEnum,
  DebugStageEnum,
  resolveErrorMsg,
} from "@done-coding/request-base";

import { createRequest as createRequestBase } from "@done-coding/request-base";
import _omit from "lodash.omit";
import _get from "lodash.get";

export * from "@done-coding/request-base";

export type Response<S> = Omit<UniApp.RequestSuccessCallbackResult, "data"> & {
  data: S;
};

export const createRequest = <S>({
  basePath,
  timeout,
  beforeRequest = (config) => config,
  networkSuccessCodeList,
  isSuccessNetworkCode = (code) =>
    Array.isArray(networkSuccessCodeList)
      ? networkSuccessCodeList.includes(code)
      : code >= 200 && code < 300,
  ...otherOpt
}: Omit<Options<UniNamespace.RequestOptions, Response<S>>, "issue"> & {
  beforeRequest?: (
    config: UniNamespace.RequestOptions,
  ) => UniNamespace.RequestOptions | Promise<UniNamespace.RequestOptions>;
}) => {
  const { request } = createRequestBase<
    UniNamespace.RequestOptions,
    Response<S>
  >({
    ...otherOpt,
    basePath,
    timeout,
    issue: async ({ TIMEOUT, url, DEBUG: debug, ...otherConfig }) => {
      const configInit: UniNamespace.RequestOptions = {
        url,
        timeout: TIMEOUT,
        ..._omit(otherConfig, ["BASE_PATH"]),
      };

      let config: typeof configInit;
      try {
        config = await beforeRequest(configInit);
      } catch (error) {
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
          message: resolveErrorMsg(error) ?? "发起请求出错",
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
      }

      const { url: configUrl } = config;
      let configUrlFinal = "";
      const urlReg = /^https?/;
      if (urlReg.test(configUrl)) {
        configUrlFinal = configUrl;
      } else {
        configUrlFinal = `${basePath}${configUrl}`;
      }

      return callback2Promise<
        Response<S>,
        UniApp.GeneralCallbackResult,
        UniApp.RequestSuccessCallbackResult
      >(({ success, fail }) => {
        uni.request({
          ...config,
          url: configUrlFinal,
          success,
          fail,
        });
      })
        .then((res) => {
          const { statusCode: code } = res;
          if (isSuccessNetworkCode(code)) {
            return dispatchBusinessResult(res, otherOpt);
          } else {
            const { errMsg = `${code}` } = res;
            throw new RequestFailResultNetwork({
              code,
              message: errMsg,
              cause: res,
            });
          }
        })
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

          const { errMsg, errno, errCode, errNo, error } =
            err as UniApp.GeneralCallbackResult & {
              /**
               * 微信未来标准code
               */
              errno?: number;
              /**
               * 微信已存在code
               */
              errCode?: number;

              /**
               * 抖音小程序标准错误码
               */
              errNo?: number;

              /**
               * 支付宝小程序标准错误码
               */
              error?: number;
            };

          let message = String(errMsg || "").trim() || "请求失败";
          let code: RequestFailResult["code"];
          // https://developers.weixin.qq.com/miniprogram/dev/framework/usability/PublicErrno.html
          // #ifdef MP-WEIXIN
          code = errno ?? errCode ?? InnerErrorCode.NO_NETWORK_CODE;
          switch (message) {
            case "request:fail timeout": {
              message = "请求超时";
              code = InnerErrorCode.NO_RESPONSE_TIMEOUT;
              break;
            }
            case "request:fail": {
              message = "请求失败";
              break;
            }
            default: {
              message = message.replace("request:fail", "请求失败:");
            }
          }
          // #endif

          // #ifdef MP-TOUTIAO
          code = errNo ?? InnerErrorCode.NO_NETWORK_CODE;
          switch (code) {
            case 21103: {
              message = "请求超时";
              code = InnerErrorCode.NO_RESPONSE_TIMEOUT;
              break;
            }
            default: {
              message = message.replace("request:fail", "请求失败:");
            }
          }
          // #endif

          // #ifdef MP-ALIPAY
          code = error ?? InnerErrorCode.NO_NETWORK_CODE;
          // #endif

          // #ifndef MP-WEIXIN || MP-TOUTIAO || MP-ALIPAY
          code =
            errno ||
            errCode ||
            errNo ||
            error ||
            InnerErrorCode.NO_NETWORK_CODE;
          if (message.includes("timeout") || message.includes("time out")) {
            message = "请求超时";
            code = InnerErrorCode.NO_RESPONSE_TIMEOUT;
          } else {
            // #ifdef WEB
            if (_get(globalThis, "navigator.onLine") === false) {
              message = "网络未连接";
              code = InnerErrorCode.NO_RESPONSE_OFFLINE;
            }
            // #endif
          }
          // #endif

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
