# 业务快照

> 文档定位：快照 · 适用于整个请求 SDK；最后核验：2026-10-28。

## ⓐ 业务领域与背景

这是面向调用方开发者的请求 SDK 仓库，不承载订单、身份或组织等业务实体。依据：四包 package.json、src/index.ts 与适配器 src/main.ts。

## ⓑ 用户画像与角色

调用者为使用 Axios、ofetch 或 uni.request 的应用开发者；后端响应结构由调用方配置提取函数适配。没有核验到终端用户规模。

## ⓒ 核心业务流程

调用方创建请求函数 → 提供请求配置 → 公共层合并配置并查缓存 → 传输适配器发起请求 → 业务结果分发 → 返回结果或进入错误处理钩子。依据：packages/base/src/main.ts、cache.ts 与三个适配器 src/main.ts。

## ⓓ 功能清单

逐模块功能与领域归属见 [领域目录](governance/MODULES.md) 和 [request 领域快照](governance/modules/request/SNAPSHOT.md#业务快照)。

## ⓔ 业务规则与约束

响应是否业务成功由调用方的 businessSuccessCodeList 或 isSuccessBusinessCode 决定；后者优先。业务码类型允许 number 或 string。依据：packages/base/src/types.ts、utils.ts。

## ⓕ 成功指标与 KPI

未发现 KPI、服务等级或用户规模的可核验定义。<!-- 待补充 -->

## ⓖ 已知业务债务

标准错误对象的非 2xx 解析尚未实现；当前三个适配器的非成功响应均走现有网络错误封装。依据：packages/{axios,ofetch,uni}/src/main.ts。此处记录现状，不代表实施承诺。
