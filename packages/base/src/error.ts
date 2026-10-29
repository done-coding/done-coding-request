import type { RequestCodeType } from "./types";

/**
 * 内部错误码
 */
export enum InnerErrorCode {
  /** 请求出错 */
  REQUEST_ERROR = "REQUEST_ERROR",
  /** 未响应 */
  NO_RESPONSE = "NO_RESPONSE",
  /** 超时未响应 */
  NO_RESPONSE_TIMEOUT = "NO_RESPONSE_TIMEOUT",
  /** 离线未响应 */
  NO_RESPONSE_OFFLINE = "NO_RESPONSE_OFFLINE",
  /** 分发响应结果执行出错 */
  DISPATCH_RESPONSE = "DISPATCH_RESPONSE",
  /** 处理RequestFailResult错误时出错 */
  DEAL_ERROR = "DEAL_ERROR",
  /** 无业务码 */
  NO_BUSINESS_CODE = "NO_BUSINESS_CODE",
  /** 无网络错误码 */
  NO_NETWORK_CODE = "NO_NETWORK_CODE",
  /**
   * 请求被中止
   */
  ABORT = "ABORT",
}

/** 错误的可选上下文，beforeError 替换为普通对象时同样保留 */
export interface RequestErrorContext {
  httpStatus?: number;
  retryable?: boolean;
  outcome?: "not_executed" | "unknown";
  fields?: unknown[];
  /** network 无响应/传输失败；http 非成功 HTTP；business 成功 HTTP 的业务失败 */
  kind?: "network" | "http" | "business";
  requestId?: string;
  cause?: unknown;
}

interface ErrorOptions extends RequestErrorContext {
  code: RequestCodeType | InnerErrorCode;
  message: string;
  isBusinessError: boolean;
}

/**
 * 请求失败信息
 */
export class RequestFailResultBase extends Error {
  /** 错误码 */
  public code: ErrorOptions["code"];
  /** 是否业务错误 */
  public isBusinessError: boolean;
  /** 错误信息 */
  public message: string;

  public httpStatus?: number;
  public retryable?: boolean;
  public outcome?: RequestErrorContext["outcome"];
  public fields?: unknown[];
  public kind?: RequestErrorContext["kind"];
  public requestId?: string;
  public cause?: unknown;

  public constructor({
    message,
    code,
    isBusinessError,
    ...context
  }: ErrorOptions) {
    super(message);
    this.message = message;
    this.code = code;
    this.isBusinessError = isBusinessError;
    this.name = "DC Request ERROR";
    Object.assign(this, context);
  }
}

/**
 * 网络错误
 */
export class RequestFailResultNetwork extends RequestFailResultBase {
  public cause: unknown;

  public constructor(options: Omit<ErrorOptions, "isBusinessError">) {
    super({
      ...options,
      kind: options.kind ?? "network",
      isBusinessError: false,
    });
    this.cause = options.cause;
  }
}

/**
 * 业务错误
 */
export class RequestFailResultBusiness extends RequestFailResultBase {
  public constructor(options: Omit<ErrorOptions, "isBusinessError">) {
    super({
      ...options,
      kind: options.kind ?? "business",
      isBusinessError: true,
    });
  }
}

/**
 * 请求失败结果
 */
export type RequestFailResult =
  | Pick<RequestFailResultNetwork, keyof ErrorOptions | "cause">
  | Pick<RequestFailResultBusiness, keyof ErrorOptions>;
