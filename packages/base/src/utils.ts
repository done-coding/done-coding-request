import type { RequestFailResult } from "./error";
import {
  InnerErrorCode,
  RequestFailResultBusiness,
  RequestFailResultNetwork,
} from "./error";
import type { BusinessOptions, RequestResult } from "./main";
import { createDebugInfo, DebugLevelEnum, DebugStageEnum } from "./debug";

/** 获取错误信息 */
export const resolveErrorMsg = (error: any) => {
  if (error instanceof Error) {
    return error.message;
  }
};

/** 分发业务结果 */
export const dispatchBusinessResult = <R, D = any>(
  res: R,
  {
    getBusinessCode,
    getBusinessMsg,
    getBusinessData,
    businessSuccessCodeList,
  }: BusinessOptions<R>,
  debug?: boolean,
): RequestResult<D> | Promise<RequestResult<D>> => {
  debug &&
    createDebugInfo(
      { stage: DebugStageEnum.NETWORK_SUCCESS, data: res },
      DebugLevelEnum.LOG,
    );
  try {
    // !!!所有外部传入的function都需要try catch
    const code = getBusinessCode(res);
    const message = getBusinessMsg(res);
    if (businessSuccessCodeList.includes(code)) {
      const info: RequestResult<D> = {
        code,
        data: getBusinessData(res),
        message,
      };
      debug &&
        createDebugInfo(
          {
            stage: DebugStageEnum.NETWORK_SUCCESS_BUSINESS_SUCCESS,
            data: info,
          },
          DebugLevelEnum.LOG,
        );
      return info;
    } else {
      if (code === undefined) {
        throw new Error("业务code未定义");
      }

      const errorInfo: RequestFailResult = new RequestFailResultBusiness({
        code,
        message: message ?? "未知错误",
      });
      debug &&
        createDebugInfo(
          {
            stage: DebugStageEnum.NETWORK_SUCCESS_BUSINESS_FAIL,
            data: errorInfo,
          },
          DebugLevelEnum.ERROR,
        );
      return Promise.reject(errorInfo);
    }
  } catch (error) {
    debug &&
      createDebugInfo(
        {
          stage: DebugStageEnum.NETWORK_SUCCESS_DISPATCH_ERROR,
          data: error,
        },
        DebugLevelEnum.ERROR,
      );
    const errorInfo: RequestFailResult = new RequestFailResultNetwork({
      code: InnerErrorCode.DISPATCH_RESPONSE,
      message: resolveErrorMsg(error) ?? "分发响应结果执行出错",
      cause: error,
    });
    return Promise.reject(errorInfo);
  }
};

/** 回调请求转Promise */
export const callback2Promise = <S, E, PS = S>(
  fn: (data: { success: (res: PS) => void; fail: (res: E) => void }) => unknown,
): Promise<S> => {
  return new Promise((resolve, reject) => {
    const success = (res: PS) => {
      return resolve(res as unknown as S);
    };
    const fail = (err: E) => {
      return reject(err);
    };
    fn({
      success,
      fail,
    });
  });
};
