import type {
  ApiConfig,
  ApiConfigBase,
  CacheOptions,
  RequestCacheConfig,
  RequestResult,
} from "./types";
import { ensureAsyncFnNotError, ensureSyncFnNotError } from "./utils";
import _curry from "lodash.curry";

/** 获取缓存运行时上下文 */
export const getCacheRunTimeCxt = async <
  D = any,
  C extends ApiConfigBase = ApiConfigBase,
>({
  cacheOptions,
  cacheConfig,
  apiConfig,
}: {
  cacheOptions?: CacheOptions;
  cacheConfig: RequestCacheConfig;
  apiConfig: ApiConfig<C>;
}) => {
  /** 缓存开启 */
  const cacheEnabled = cacheConfig.useCache && !!cacheOptions;
  let cacheKey = "";

  if (cacheEnabled) {
    cacheKey = ensureSyncFnNotError(cacheOptions.getKey, "")(apiConfig);
  }

  const cacheResult: RequestResult<D> | undefined = cacheEnabled
    ? await ensureAsyncFnNotError(
        cacheOptions.getCache<D>,
        Promise.resolve(undefined),
      )(cacheKey)
    : undefined;

  const setCache = cacheEnabled
    ? ensureAsyncFnNotError(
        _curry(cacheOptions.setCache<D>)(cacheKey),
        Promise.resolve(),
      )
    : undefined;

  return {
    cacheEnabled,
    cacheKey,
    cacheResult,
    setCache,
  };
};
