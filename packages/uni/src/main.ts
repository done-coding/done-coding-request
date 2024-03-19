import type { Options, RequestFailResult } from "@done-coding/request-base";
import {
  dispatchBusinessResult,
  InnerErrorCode,
  callback2Promise,
} from "@done-coding/request-base";

import { createRequest as createRequestBase } from "@done-coding/request-base";
import _omit from "lodash/omit";

export const createRequest = ({
  basePath,
  timeout,
  beforeRequest = (config) => config,
  ...otherOpt
}: Options<UniNamespace.RequestOptions, UniApp.RequestSuccessCallbackResult> & {
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
    issue: async ({ TIMEOUT, url, ...otherConfig }) => {
      const configInit: UniNamespace.RequestOptions = {
        url: `${basePath}${url}`,
        timeout: TIMEOUT,
        ..._omit(otherConfig, ["BASE_PATH"]),
      };

      let config: typeof configInit;
      try {
        config = await beforeRequest(configInit);
      } catch (error) {
        const errorInfo: RequestFailResult = {
          code: InnerErrorCode.REQUEST_ERROR,
          message: "发起请求出错",
          isBusinessError: false,
          cause: error,
        };
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
      }).then((res) => dispatchBusinessResult(res, otherOpt));
    },
  });

  return request;
};
