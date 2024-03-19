import type { Options, RequestFailResult } from "@done-coding/request-base";
import {
  dispatchBusinessResult,
  InnerErrorCode,
} from "@done-coding/request-base";
import { createRequest as createRequestBase } from "@done-coding/request-base";
import axios from "axios";
import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosInterceptorManager,
  AxiosRequestConfig,
} from "axios";
import _omit from "lodash/omit";

export const createRequest = ({
  basePath,
  timeout,
  beforeRequest = (config) => config,
  ...otherOpt
}: Options<InternalAxiosRequestConfig, AxiosResponse> & {
  beforeRequest?: Parameters<
    AxiosInterceptorManager<InternalAxiosRequestConfig>["use"]
  >[0];
}) => {
  const instance = axios.create({
    baseURL: basePath,
    timeout,
  });

  instance.interceptors.request.use(beforeRequest, (error) => {
    const errorInfo: RequestFailResult = {
      code: InnerErrorCode.REQUEST_ERROR,
      message: "发起请求出错",
      isBusinessError: false,
      cause: error,
    };
    return Promise.reject(errorInfo);
  });

  const { request } = createRequestBase<AxiosRequestConfig, AxiosResponse>({
    ...otherOpt,
    basePath,
    timeout,
    issue: ({ TIMEOUT, ...otherConfig }) => {
      return instance({
        timeout: TIMEOUT,
        ..._omit(otherConfig, ["BASE_PATH"]),
      }).then((res) => dispatchBusinessResult(res, otherOpt));
    },
  });

  return request;
};
