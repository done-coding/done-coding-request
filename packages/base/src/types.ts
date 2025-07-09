import type { RequestFailResult } from "./error";

/** 请求状态码类型 */
export type RequestCodeType = number | string;

/** 请求结果 */
export interface RequestResult<D, R> {
  /** 业务状态码 */
  code: RequestCodeType;
  /** 数据主体 */
  data: D;
  /** 业务提示信息 */
  message: string;
  /**
   * 接口返回的原始业务层数据
   * ---
   * ---
   * ---
   * 留口子提供原始数据原因及建议如下:
   * ---
   * - 考虑会存在情况: 有的接口存在在业务码这一层级还返回其他的 如分页信息 而不是全部放到data里
   * - 若非必须要 建议不要访问
   * - 如果访问建议只访问非data的其他属性
   */
  _raw: R;
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

/** 请求缓存配置 */
export interface RequestCacheConfig {
  /** 是否使用缓存 */
  useCache?: boolean;
}

/** 拓展配置 */
export interface ExtendConfig {
  /** 请求ui配置 */
  uiConfig?: RequestUiConfig;
  /** 请求缓存配置 */
  cacheConfig?: RequestCacheConfig;
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
  getBusinessCode: (res: R) => RequestCodeType;
  /** 获取业务信息 */
  getBusinessMsg: (res: R) => string;
  /** 获取业务数据 */
  getBusinessData: <D = unknown>(res: R) => D;
  /** 业务成功状态码列表 */
  businessSuccessCodeList?: RequestCodeType[];
  /**
   * 是否是成功的业务码
   * 优先级高于businessSuccessCodeList
   */
  isSuccessBusinessCode?: (code: RequestCodeType) => boolean;
}

/** ui配置项 */
export interface UiOptions {
  /** 展示提示 */
  showToast?: (message: string) => void;
}

/** 缓存设置函数-无key */
export type CacheSetNoKey<D, R> = (
  data: RequestResult<D, R>,
  config: RequestCacheConfig,
) => Promise<void>;

/** 缓存选项 */
export interface CacheOptions {
  /** 获取缓存key */
  getKey: <C extends ApiConfigBase>(apiConfig: ApiConfig<C>) => string;
  /**
   * 设置缓存
   * --
   * 业务成功才会调用
   */
  setCache: <D, R>(
    key: string,
    ...args: Parameters<CacheSetNoKey<D, R>>
  ) => ReturnType<CacheSetNoKey<D, R>>;
  /** 获取缓存 */
  getCache: <D, R>(key: string) => Promise<RequestResult<D, R> | undefined>;
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
    ExtendConfig,
    UiOptions {
  /** 根路径 */
  basePath: string;
  /** 超时时间 */
  timeout: number;
  /** 发起请求的方法 */
  issue: <D>(
    config: IssueConfig<C>,
    extendConfig: ExtendConfig,
  ) => Promise<RequestResult<D, R>>;
  /** 处理错误 */
  beforeError?: (
    currentError: RequestFailResult,
    options: {
      extendConfig: ExtendConfig;
      apiConfig: ApiConfig<C>;
    },
  ) => BeforeErrorResult | Promise<BeforeErrorResult>;
  /** 成功的网络状态码 */
  networkSuccessCodeList?: number[];
  /**
   * 是否是成功的网络状态码
   * 优先级高于networkSuccessCodeList
   */
  isSuccessNetworkCode?: (code: number) => boolean;
  /** 缓存选项配置 */
  cache?: CacheOptions;
}
