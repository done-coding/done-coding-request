import { RequestFailResultBusiness, RequestFailResultNetwork } from "./error";
import type {
  BusinessOptions,
  ErrorResponse,
  ErrorResponseGetters,
  ResponseErrorInfo,
} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isCode = (value: unknown): value is string | number =>
  typeof value === "string" || typeof value === "number";

/** 标准解析器（需显式配置开启）：业务码和文案只从已有 getter 读取，畸形包体交给 HTTP 兜底。 */
export const getErrorFromResponse = (
  { body }: ErrorResponse,
  getters: ErrorResponseGetters,
): ResponseErrorInfo | undefined => {
  let code: unknown;
  try {
    code = getters.getBusinessCode(body);
  } catch {
    return undefined;
  }
  if (!isCode(code)) {
    return undefined;
  }
  let message: unknown;
  try {
    message = getters.getBusinessMsg(body);
  } catch {
    // 文案不可读取时仍保留已经读到的业务码。
  }
  const extra = isRecord(body) && isRecord(body.error) ? body.error : {};
  return {
    code,
    message: typeof message === "string" ? message : undefined,
    retryable:
      typeof extra.retryable === "boolean" ? extra.retryable : undefined,
    outcome:
      extra.outcome === "not_executed" || extra.outcome === "unknown"
        ? extra.outcome
        : undefined,
    fields: Array.isArray(extra.fields) ? extra.fields : undefined,
  };
};

/** 失败 HTTP 响应的公共入口；转换包体以复用适配器已有的 getter 入参形状。 */
export const createHttpError = <R>({
  response,
  options,
  toBusinessResponse,
  cause,
  legacyMessage = response.statusText,
}: {
  response: ErrorResponse;
  options: BusinessOptions<R>;
  toBusinessResponse: (body: unknown) => R;
  cause?: unknown;
  /** 未配置解析器时保留适配器 1.2.3 的文案，包括空字符串。 */
  legacyMessage?: string;
}) => {
  const getters: ErrorResponseGetters = {
    getBusinessCode: (body) =>
      options.getBusinessCode(toBusinessResponse(body)),
    getBusinessMsg: (body) => options.getBusinessMsg(toBusinessResponse(body)),
    getBusinessData: <D>(body: unknown) =>
      options.getBusinessData<D>(toBusinessResponse(body)),
  };
  let info: ResponseErrorInfo | undefined;
  try {
    info = options.getErrorFromResponse?.(response, getters);
  } catch {
    // 调用方解析器不能把已收到的 HTTP 响应变成网络错误。
  }
  const context = {
    httpStatus: response.status,
    kind: "http" as const,
    requestId:
      isRecord(response.body) && typeof response.body.requestId === "string"
        ? response.body.requestId
        : undefined,
    cause,
  };
  const message = options.getErrorFromResponse
    ? info?.message ?? (response.statusText || `HTTP ${response.status}`)
    : legacyMessage;
  if (isCode(info?.code)) {
    return new RequestFailResultBusiness({
      ...info,
      ...context,
      code: info.code,
      message,
    });
  }
  return new RequestFailResultNetwork({
    ...info,
    ...context,
    code: response.status,
    message,
  });
};
