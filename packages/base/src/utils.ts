import type { RequestFailResult } from "./error";
import {
  InnerErrorCode,
  RequestFailResultBusiness,
  RequestFailResultNetwork,
} from "./error";
import type { BusinessOptions, RequestResult } from "./main";

/** 分发业务结果 */
export const dispatchBusinessResult = <R, D = any>(
  res: R,
  {
    getBusinessCode,
    getBusinessMsg,
    getBusinessData,
    businessSuccessCodeList,
  }: BusinessOptions<R>,
): RequestResult<D> | Promise<RequestResult<D>> => {
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
      return info;
    } else {
      const errorInfo: RequestFailResult = new RequestFailResultBusiness({
        code,
        message,
      });
      return Promise.reject(errorInfo);
    }
  } catch (error) {
    const errorInfo: RequestFailResult = new RequestFailResultNetwork({
      code: InnerErrorCode.DISPATCH_RESPONSE,
      message: "分发响应结果执行出错",
      cause: error,
    });
    return Promise.reject(errorInfo);
  }
};

/** 回调请求转Promise */
export const callback2Promise = <S, E>(
  fn: (res: { success: (res: S) => void; fail: (res: E) => void }) => unknown,
): Promise<S> => {
  return new Promise((resolve, reject) => {
    const success = (res: S) => resolve(res);
    const fail = (res: E) => reject(res);
    fn({
      success,
      fail,
    });
  });
};
