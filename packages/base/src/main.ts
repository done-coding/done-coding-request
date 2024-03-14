import _assign from "lodash/assign";

/** 请求方法 */
type Method = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "HEAD";

/** 请求结果 */
export interface RequestResult<D> {
  code: number;
  data: D;
  message: string;
}

/** 请求失败结果 */
export interface RequestFailResult {
  code: number;
  message: string;
  /** 是否业务出错  */
  isBusinessError: boolean;
}

/** api配置选项 */
export interface ApiConfig {
  /** 请求地址 */
  url: string;
  /** 请求方法 */
  method: Method;
  /** 请求数据主体 */
  data?: unknown;
  /** 请求query参数 */
  params?: Record<string, string>;
  /** 超时时间 */
  timeout?: number;
  /** 请求头 */
  headers?: Record<string, string>;
}

export interface IssueConfig extends ApiConfig {
  /** 根路径 */
  basePath: string;
  /** 超时时间 */
  timeout: number;
}

/** 处理错误结果 */
export interface DealErrorResult {
  /** 可以展示错误提示 */
  canShowErrorToast: boolean;
  /** 重新请求 */
  reload?: boolean;
  /** 新的错误 */
  newError: RequestFailResult;
}

/** request 选项 */
interface Options<
  RC extends Record<string, unknown> = Record<string, unknown>,
> {
  /** 根路径 */
  basePath: string;
  /** 超时时间 */
  timeout: number;
  /** ui配置 */
  uiConfig: RequestUiConfig;
  /** 请求配置 */
  request: {
    /** 获取请求头 */
    getHeaders?: () => Record<string, string>;
    /** 处理请求报文 */
    before?: (requestConfig: RC) => Promise<RC>;
  };
  /** 响应配置 */
  response: {
    /** 网络 */
    network: {
      /** 成功状态码列表 【如果不设置 则直接认为都成功 !!!比如小程序】 */
      successCodeList?: number[];
      /** 获取响应状态码 */
      getCode: (response: any) => number;
      /** 获取响应信息 */
      getMsg: (response: any) => string;
      /** 处理网络错误 */
      dealError: (
        currentError: RequestFailResult,
        uiConfig: RequestUiConfig,
      ) => Promise<DealErrorResult>;
    };
    /** 业务 */
    business: {
      /** 成功状态码列表 */
      successCodeList: number[];
      /** 获取业务状态码 */
      getCode: (response: any) => number;
      /** 获取业务信息 */
      getMsg: (response: any) => string;
      /** 获取后端返回的数据主体 */
      getData: (response: any) => any;
      /** 处理业务错误 */
      dealError: (
        currentError: RequestFailResult,
        uiConfig: RequestUiConfig,
      ) => Promise<DealErrorResult>;
    };
  };
  issue: <D>(
    config: IssueConfig,
    uiConfig: RequestUiConfig,
  ) => Promise<RequestResult<D>>;
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

export interface XApiConfig extends ApiConfig {
  /** 请求ui配置 */
  uiConfig?: RequestUiConfig;
}

export class Request {
  private options: Options;

  private get basePath() {
    return this.options.basePath;
  }

  private get headers() {
    return this.options.request.getHeaders?.() || {};
  }

  private get timeout() {
    return this.options.timeout;
  }

  private get uiConfig() {
    return this.options.uiConfig;
  }

  private get issue() {
    return this.options.issue;
  }

  private get networkSuccessCodeList() {
    return this.options.response.network.successCodeList;
  }

  private get networkGetCode() {
    return this.options.response.network.getCode;
  }

  private get networkGetMsg() {
    return this.options.response.network.getMsg;
  }

  private get networkDealError() {
    return this.options.response.network.dealError;
  }

  private get businessSuccessCodeList() {
    return this.options.response.business.successCodeList;
  }

  private get businessGetCode() {
    return this.options.response.business.getCode;
  }

  private get businessGetMsg() {
    return this.options.response.business.getMsg;
  }

  private get businessGetData() {
    return this.options.response.business.getData;
  }

  private get businessDealError() {
    return this.options.response.business.dealError;
  }

  public constructor(opt: Options) {
    this.options = opt;
  }

  public request = async <D>(
    apiConfig: XApiConfig,
  ): Promise<RequestResult<D>> => {
    const {
      url,
      method,
      timeout = this.timeout,
      headers = {},
      uiConfig = {},
    } = apiConfig;

    const headersFinal = _assign({}, this.headers, headers);

    const uiConfigFinal = _assign({}, this.uiConfig, uiConfig);

    const config: IssueConfig = {
      url,
      method,
      params: apiConfig.params,
      data: apiConfig.data,
      timeout,
      headers: headersFinal,
      basePath: this.basePath,
    };

    try {
      const res = await this.issue(config, uiConfigFinal);

      const networkCode = this.networkGetCode(res);

      const { networkSuccessCodeList } = this;
      // 如果不是成功状态码 转网络失败 被下方catch捕获
      if (
        networkSuccessCodeList &&
        !networkSuccessCodeList.includes(networkCode)
      ) {
        throw res;
      }

      const code = this.businessGetCode(res);
      const message = this.businessGetMsg(res);
      if (this.businessSuccessCodeList.includes(code)) {
        const resFinal: RequestResult<D> = {
          code,
          message,
          data: this.businessGetData(res),
        };
        return resFinal;
      } else {
        const errorFinal: RequestFailResult = {
          code,
          message,
          isBusinessError: true,
        };
        const { newError, reload } = await this.businessDealError(
          errorFinal,
          uiConfigFinal,
        );
        if (reload) {
          return this.request(apiConfig);
        } else {
          return Promise.reject(newError);
        }
      }
    } catch (error) {
      const code = this.networkGetCode(error);
      const message = this.networkGetMsg(error);

      const errorFinal: RequestFailResult = {
        code,
        message,
        isBusinessError: false,
      };
      const { newError, reload } = await this.networkDealError(
        errorFinal,
        uiConfigFinal,
      );
      if (reload) {
        return this.request(apiConfig);
      } else {
        return Promise.reject(newError);
      }
    }
  };
}

/** 创建请求实例 */
export const createRequest = (opt: Options) => {
  return new Request(opt);
};
