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
import _omit from "lodash/omit";

export * from "@done-coding/request-base";

export const createRequest = ({
  basePath,
  timeout,
  beforeRequest = (config) => config,
  ...otherOpt
}: Omit<
  Options<UniNamespace.RequestOptions, UniApp.RequestSuccessCallbackResult>,
  "issue"
> & {
  beforeRequest?: (
    config: UniNamespace.RequestOptions,
  ) => UniNamespace.RequestOptions | Promise<UniNamespace.RequestOptions>;
}) => {
  const { request } = createRequestBase<
    UniNamespace.RequestOptions,
    UniApp.RequestSuccessCallbackResult
  >({
    ...otherOpt,
    basePath,
    timeout,
    issue: async ({ TIMEOUT, url, DEBUG: debug, ...otherConfig }) => {
      const configInit: UniNamespace.RequestOptions = {
        url: `${basePath}${url}`,
        timeout: TIMEOUT,
        ..._omit(otherConfig, ["BASE_PATH"]),
      };

      let config: typeof configInit;
      try {
        config = await beforeRequest(configInit);
      } catch (error) {
        debug &&
          createDebugInfo(
            { stage: DebugStageEnum.BEFORE_ERROR, data: error },
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

      return callback2Promise<
        UniApp.RequestSuccessCallbackResult,
        UniApp.GeneralCallbackResult
      >(({ success, fail }) => {
        uni.request({
          ...config,
          success,
          fail,
        });
      })
        .then((res) => dispatchBusinessResult(res, otherOpt))
        .catch((err) => {
          debug &&
            createDebugInfo(
              {
                stage: DebugStageEnum.NETWORK_ERROR,
                data: err,
              },
              DebugLevelEnum.ERROR,
            );

          const {
            errMsg: message,
            errno,
            errCode,
            errNo,
            error,
          } = err as UniApp.GeneralCallbackResult & {
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
          let code: RequestFailResult["code"];
          // https://developers.weixin.qq.com/miniprogram/dev/framework/usability/PublicErrno.html
          // #ifdef MP-WEIXIN
          code = errno ?? errCode ?? InnerErrorCode.NO_NETWORK_CODE;

          // #endif

          // #ifdef MP-TOUTIAO
          code = errNo ?? InnerErrorCode.NO_NETWORK_CODE;
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
