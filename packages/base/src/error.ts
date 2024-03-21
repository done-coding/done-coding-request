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
}

interface ErrorOptions {
  code: number | InnerErrorCode;
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

  public constructor({ message, code, isBusinessError }: ErrorOptions) {
    super(message);
    this.message = message;
    this.code = code;
    this.isBusinessError = isBusinessError;
    this.name = "DC Request ERROR";
  }
}

/**
 * 网络错误
 */
export class RequestFailResultNetwork extends RequestFailResultBase {
  public cause: unknown;

  /**
   * @param cause 错误原因
   */
  public constructor({
    message,
    code,
    cause,
  }: Omit<ErrorOptions, "isBusinessError"> & {
    /** 错误原因 */
    cause?: unknown;
  }) {
    super({ message, code, isBusinessError: false });

    this.cause = cause;
  }
}

/**
 * 业务错误
 */
export class RequestFailResultBusiness extends RequestFailResultBase {
  public constructor({ message, code }: Omit<ErrorOptions, "isBusinessError">) {
    super({ message, code, isBusinessError: true });
  }
}

/**
 * 请求失败结果
 */
export type RequestFailResult =
  | Pick<RequestFailResultNetwork, keyof ErrorOptions | "cause">
  | Pick<RequestFailResultBusiness, keyof ErrorOptions>;
