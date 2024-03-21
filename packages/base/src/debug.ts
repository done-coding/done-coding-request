import { RequestFailResultBase } from "./error";
/**
 * 调试信息级别
 */
export enum DebugLevelEnum {
  LOG = "log",
  WARN = "warn",
  ERROR = "error",
}

/**
 * 调试阶段枚举
 */
export enum DebugStageEnum {
  /** 发起请求前阶段 */
  BEFORE = "1 发起请求前阶段",
  /** 发起请求前阶段出错 */
  BEFORE_ERROR = "1.1 发起请求前阶段出错",
  /** 发起请求前阶段-原始错误 */
  BEFORE_ERROR_ORIGIN = "1.1.1 发起请求前阶段-原始错误",
  /** 发起请求前阶段-包装后错误[数据结果不正确 需要保证最终得到的数据结构可控] */
  BEFORE_ERROR_PACK = "1.1.2 发起请求前阶段-包装后错误",
  /** 网络阶段 */
  NETWORK = "2 网络阶段",
  /** 网络成功阶段 */
  NETWORK_SUCCESS = "2.1 网络成功阶段",
  /** 网路成功且业务成功 */
  NETWORK_SUCCESS_BUSINESS_SUCCESS = "2.1.1 网路成功且业务成功",
  /** 网络成功但业务失败 */
  NETWORK_SUCCESS_BUSINESS_FAIL = "2.1.2 网络成功但业务失败",
  /** 网络成功但分发业务结果出错 */
  NETWORK_SUCCESS_DISPATCH_ERROR = "2.1.3 网络成功但分发业务结果出错",
  /** 网络出错阶段 */
  NETWORK_ERROR = "2.2 网络出错阶段",
  /** 网络出错阶段出错 */
  NETWORK_ERROR_ORIGIN = "2.2.1 网络出错阶段-原始错误",
  /* 网络出错阶段-包装后错误[保证最终得到的数据结构可控] */
  NETWORK_ERROR_PACK = "2.2.2 网络出错阶段-包装后错误",
  /** 处理错误阶段 */
  DEAL_ERROR = "3 处理错误阶段",
  /** 处理错误阶段出错 */
  DEAL_ERROR_ERROR = "3.1 处理错误阶段出错",
  /** 处理错误结果 */
  DEAL_ERROR_RESULT = "3.2 处理错误结果",
  /** 处理错误结果-重新请求 */
  DEAL_ERROR_RESULT_RELOAD = "3.2.1 处理错误结果-重新请求",
  /** 处理错误结果-正常抛错 */
  DEAL_ERROR_RESULT_CONTINUE = "3.2.2 处理错误结果-正常抛错",
}

/**
 * 创建调试信息
 */
export const createDebugInfo = <M>(
  {
    stage,
    data,
  }: {
    stage: DebugStageEnum;
    data?: M;
  },
  level: DebugLevelEnum = DebugLevelEnum.LOG,
) => {
  console[level](
    stage,
    data instanceof RequestFailResultBase ? { ...data } : data,
  );
};
