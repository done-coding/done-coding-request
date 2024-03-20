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
  /** 分发响应结果执行出错 */
  DISPATCH_RESPONSE = "DISPATCH_RESPONSE",
  /** 处理RequestFailResult错误时出错 */
  DEAL_ERROR = "DEAL_ERROR",
  /** 无错误码 */
  NO_CODE = "NO_CODE",
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

  public constructor({ message, code, isBusinessError }: ErrorOptions) {
    super(message);
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
