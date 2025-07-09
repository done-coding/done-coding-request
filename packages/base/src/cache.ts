import type {
  ApiConfig,
  ApiConfigBase,
  CacheOptions,
  CacheSetNoKey,
  RequestCacheConfig,
  RequestResult,
} from "./types";
import { ensureAsyncFnNotError, ensureSyncFnNotError } from "./utils";
import _curry from "lodash.curry";

/** 获取缓存运行时上下文 */
export const getCacheRunTimeCxt = async <D, R, C extends ApiConfigBase>({
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

  const cacheResult: RequestResult<D, R> | undefined = cacheEnabled
    ? await ensureAsyncFnNotError(
        cacheOptions.getCache<D, R>,
        Promise.resolve(undefined),
      )(cacheKey)
    : undefined;

  const setCache: CacheSetNoKey<D, R> | undefined = cacheEnabled
    ? ensureAsyncFnNotError(
        _curry(cacheOptions.setCache<D, R>)(cacheKey),
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
