# 技术架构快照

> 文档定位：快照 · 适用于整个请求 SDK；最后核验：2026-10-29（本批仅复核发布配置）。

## ⓐ 系统上下文

库由应用进程直接调用；底层网络分别交给传入的 Axios / Fetch 或环境中的 uni.request。仓库没有跟踪服务部署文件。

## ⓑ 技术选型

TypeScript ^5.2.2、Vite ^5.0.10、Vitest ^1.1.1、vite-plugin-dts ^3.7.0；根 engines 为 Node.js >=18。这些是清单声明范围，不是本轮实装版本。依据：根及各包 package.json。

## ⓒ 架构风格与模式

pnpm workspace + Lerna monorepo；公共请求执行与传输适配分层，三个适配器通过公开包名导入 base。

## ⓓ 模块/组件结构

以 [MODULES.md](governance/MODULES.md) 为领域映射唯一入口；包内部结构见各包 README 的 repo-map。

## ⓔ 数据架构

没有持久化数据库；缓存通过调用方传入的 getKey / setCache / getCache 实现，SDK 不选择存储。依据：packages/base/src/cache.ts 与 types.ts。

## ⓕ 设计原则与约定

见 [治理组合快照的全局技术基线](governance/SNAPSHOT.md#全局技术基线)。

## ⓖ 架构决策记录（ADR）

仓内没有独立 ADR 目录。已核对 git 历史：93b602c 扩展 isSuccessBusinessCode 的响应参数；9049367 增加成功结果 \_raw。当前源码与这两项记录一致。

## ⓗ 质量属性与非功能需求

各包 sideEffects 为 []，声明 ESM / CJS / TypeScript 类型出口；没有核验到性能预算或覆盖率阈值。

## ⓘ 注意事项与常见陷阱

base 的 test 脚本仅 echo，不能当独立单测通过；适配器 test 是交互式 vitest，单次运行须追加 --run。uni 测试配置使用 jsdom。

## ⓙ 技术债务与风险

仓库未锁定 packageManager 版本；发布 CI 的当前事实与操作边界见 [治理组合快照](governance/SNAPSHOT.md#全局技术基线)；本轮未安装依赖、未运行代码测试或构建。未发现标准错误对象的字段校验实现。

## ⓚ 开发工作流

开发入口见 [DEVELOPMENT.md](governance/DEVELOPMENT.md)；真实脚本来源为各包 package.json。根 Husky pre-commit 调用 lint-staged，commit-msg 调用 commitlint；本轮不调整钩子配置。

## ⓛ 横切关注点

见 [治理组合快照的全局技术基线](governance/SNAPSHOT.md#全局技术基线)。
