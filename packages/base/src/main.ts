import _assign from "lodash/assign";

import type { RequestFailResult } from "./error";
import {
  RequestFailResultNetwork,
  RequestFailResultBusiness,
  InnerErrorCode,
  RequestFailResultBase,
} from "./error";
import { DebugLevelEnum, createDebugInfo, DebugStageEnum } from "./debug";
import { resolveErrorMsg } from "./utils";

/** 请求结果 */
export interface RequestResult<D> {
  code: number;
  data: D;
  message: string;
}

/**
 * 请求ui配置
 */
export interface RequestUiConfig {
  /**
   * 错误提示
   */
  errorToast?: boolean;
}

/** 拓展配置 */
export interface ExtendConfig {
  /** 请求ui配置 */
  uiConfig?: RequestUiConfig;
}

export type ApiConfigBase = Record<string, any>;

/** api配置选项 */
export type ApiConfig<C extends ApiConfigBase> = C & ExtendConfig;

/** 发起请求选项 */
export type IssueConfig<C extends ApiConfigBase> = C & {
  BASE_PATH: string;
  TIMEOUT: number;
  /** 开启调试 */
  DEBUG?: boolean;
};

/** 业务配置项 */
export interface BusinessOptions<R> {
  /** 获取业务状态码 */
  getBusinessCode: (res: R) => number;
  /** 获取业务信息 */
  getBusinessMsg: (res: R) => string;
  /** 获取业务数据 */
  getBusinessData: <D = unknown>(res: R) => D;
  /** 业务成功状态码列表 */
  businessSuccessCodeList: number[];
}

/**
 * 处理错误结果重新请求
 */
export interface BeforeErrorResultReload {
  reload: true;
}

/** 处理错误结果不重新请求 */
export interface BeforeErrorResultNotReload {
  /** 可以展示错误提示 */
  canShowErrorToast?: boolean;
  reload?: false;
  /** 新的错误 */
  newError: RequestFailResult;
}

/** 处理错误结果 */
export type BeforeErrorResult =
  | BeforeErrorResultReload
  | BeforeErrorResultNotReload;

/** request 选项 */
export interface Options<C extends ApiConfigBase, R>
  extends BusinessOptions<R>,
    ExtendConfig {
  /** 根路径 */
  basePath: string;
  /** 超时时间 */
  timeout: number;
  /** 发起请求的方法 */
  issue: <D>(
    config: IssueConfig<C>,
    extendConfig: ExtendConfig,
  ) => Promise<RequestResult<D>>;
  /** 处理错误 */
  beforeError?: (
    currentError: RequestFailResult,
    options: {
      extendConfig: ExtendConfig;
      apiConfig: ApiConfig<C>;
    },
  ) => BeforeErrorResult | Promise<BeforeErrorResult>;
  /** 展示提示 */
  showToast?: (message: string) => void;
}

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

    const { uiConfig = {}, ...otherXApiConfig } = apiConfig;

    const uiConfigFinal = _assign({}, this.uiConfig, uiConfig);

    const extendConfig: ExtendConfig = {
      uiConfig: uiConfigFinal,
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
        return this.request(apiConfig);
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
