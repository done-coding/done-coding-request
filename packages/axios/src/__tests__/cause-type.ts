import type { RequestFailResultNetwork } from "../index";

declare const error: RequestFailResultNetwork;
// 1.2.3 合法的结构赋值必须继续通过 tsc；不能把 cause 弱化为可选属性。
export const target: { cause: unknown } = error;
