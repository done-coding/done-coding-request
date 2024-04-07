/**
 * TODO: ofetch有导出类型 FetchOptions & FetchResponse，此处最后编译时报移植相关问题 此处类型复制其类型
 */

interface ResponseMap {
  blob: Blob;
  text: string;
  arrayBuffer: ArrayBuffer;
  stream: ReadableStream<Uint8Array>;
}
type ResponseType = keyof ResponseMap | "json";

/** fetch选项 */
export interface FetchOptions {
  baseURL?: string;
  body?: RequestInit["body"] | Record<string, any>;
  headers?: HeadersInit;
  ignoreResponseError?: boolean;
  params?: Record<string, any>;
  query?: Record<string, any>;
  parseResponse?: (responseText: string) => any;
  responseType?: ResponseType;
  /**
   * @experimental Set to "half" to enable duplex streaming.
   * Will be automatically set to "half" when using a ReadableStream as body.
   * https://fetch.spec.whatwg.org/#enumdef-requestduplex
   */
  duplex?: "half" | undefined;
  /** timeout in milliseconds */
  timeout?: number;
  retry?: number | false;
  /** Delay between retries in milliseconds. */
  retryDelay?: number;
  /** Default is [408, 409, 425, 429, 500, 502, 503, 504] */
  retryStatusCodes?: number[];
}

export interface FetchResponse<S> {
  _data: S;
}
