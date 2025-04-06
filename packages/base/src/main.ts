import _assign from "lodash.assign";

import type { RequestFailResult } from "./error";
import {
  RequestFailResultNetwork,
  RequestFailResultBusiness,
  InnerErrorCode,
  RequestFailResultBase,
} from "./error";
import { DebugLevelEnum, createDebugInfo, DebugStageEnum } from "./debug";
import { resolveErrorMsg } from "./utils";
import type {
  ApiConfig,
  ApiConfigBase,
  BeforeErrorResult,
  ExtendConfig,
  IssueConfig,
  Options,
  RequestResult,
} from "./types";

/** dealError错误捕捉 */
// !!!所有外部传入的function都需要try catch
export const catchBeforeError = (
  fn: () => BeforeErrorResult | Promise<BeforeErrorResult>,
  debug?: boolean,
): BeforeErrorResult | Promise<BeforeErrorResult> => {
  try {
    return fn();
  } catch (error) {
    debug &&
      createDebugInfo(
        {
          stage: DebugStageEnum.DEAL_ERROR_ERROR,
          data: error,
        },
        DebugLevelEnum.ERROR,
      );
    /**
     * !!!此阶段则抛错没有抛原始错误而逝抛出处理错误时的错误 是因为此类错误输入开发阶段开发者的问题 需要保证上线不会出现此阶段错误
     */
    const errorInfo: RequestFailResult = new RequestFailResultNetwork({
      code: InnerErrorCode.DEAL_ERROR,
      message: resolveErrorMsg(error) ?? "处理RequestFailResult错误时出错",
      cause: error,
    });
    return {
      canShowErrorToast: true,
      newError: errorInfo,
      reload: false,
    };
  }
};

export class Request<C extends ApiConfigBase, R> {
  private options: Options<C, R>;

  private get basePath() {
    return this.options.basePath;
  }

  private get timeout() {
    return this.options.timeout;
  }

  private get uiConfig() {
    return this.options.uiConfig || {};
  }

  private get cacheConfig() {
    return this.options.cacheConfig || {};
  }

  private get issue() {
    return this.options.issue;
  }

  private get beforeError() {
    return this.options.beforeError;
  }

  private get showToast() {
    return this.options.showToast;
  }

  public constructor(opt: Options<C, R>) {
    this.options = opt;
  }

  public request = async <D>(
    apiConfig: ApiConfig<C>,
    /** 开启调试 */
    debug = false,
  ): Promise<RequestResult<D>> => {
    debug &&
      createDebugInfo({
        stage: DebugStageEnum.BEFORE,
        data: apiConfig,
      });

    const { uiConfig = {}, cacheConfig = {}, ...otherXApiConfig } = apiConfig;

    const uiConfigFinal = _assign({}, this.uiConfig, uiConfig);

    const cacheConfigFinal = _assign({}, this.cacheConfig, cacheConfig);

    const extendConfig: ExtendConfig = {
      uiConfig: uiConfigFinal,
      cacheConfig: cacheConfigFinal,
    };

    const config: IssueConfig<C> = {
      ...(otherXApiConfig as C),
      BASE_PATH: this.basePath,
      TIMEOUT: this.timeout,
      debug,
    };

    try {
      const res = await this.issue<D>(config, extendConfig);
      return res;
    } catch (error) {
      const beforeErrorRes = await catchBeforeError(() => {
        debug &&
          createDebugInfo({
            stage: DebugStageEnum.DEAL_ERROR,
            data: error,
          });
        return (
          this.beforeError?.(error as RequestFailResult, {
            apiConfig,
            extendConfig,
          }) || {
            canShowErrorToast: true,
            newError: error as RequestFailResult,
          }
        );
      }, debug);
      if (beforeErrorRes.reload) {
        debug &&
          createDebugInfo({
            stage: DebugStageEnum.DEAL_ERROR_RESULT_RELOAD,
          });
        return this.request(apiConfig, debug);
      } else {
        const { newError, canShowErrorToast = true } = beforeErrorRes;
        if (canShowErrorToast && (uiConfigFinal.errorToast ?? true)) {
          this.showToast?.(newError.message);
        }
        let newErrorFinal: RequestFailResult;

        if (newError instanceof RequestFailResultBase) {
          newErrorFinal = newError;
        } else {
          if (newError.isBusinessError) {
            newErrorFinal = new RequestFailResultBusiness(newError);
          } else {
            newErrorFinal = new RequestFailResultNetwork(newError);
          }
        }

        debug &&
          createDebugInfo({
            stage: DebugStageEnum.DEAL_ERROR_RESULT_CONTINUE,
            data: newErrorFinal,
          });

        return Promise.reject(newErrorFinal);
      }
    }
  };
}

/** 创建请求实例 */
export const createRequest = <C extends ApiConfigBase, R>(
  opt: Options<C, R>,
) => {
  return new Request<C, R>(opt);
};
