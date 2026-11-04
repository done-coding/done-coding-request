# 治理组合快照

> 文档定位：快照 · 适用于本仓领域组合；运行时核验：2026-10-29；发布配置核验：2026-11-02。

## 领域摘要

- [request](modules/request/SNAPSHOT.md)：公共请求运行时与 Axios、ofetch、uni.request 三种适配，代码归属见 MODULES.md。

## 依赖与契约

包依赖方向为三个适配器 → base；适配器不相互导入。调用方负责传入响应提取函数，传输层负责发起请求，公共层负责结果分发、缓存与错误钩子。
公共类型细节见领域快照；项目全貌见上一级三份快照，不在此重列清单声明版本。

## 全局技术基线

- 根 ESLint / Prettier 配置供四包继承；lint-staged 仅匹配代码扩展名，Markdown 须独立检查。
- Vite 为库产出 ESM、CJS，vite-plugin-dts 产出声明；本地 chore/npm-oidc-publishing 分支将 Lerna 固定为 9.0.7，将两个发布工作流合并为单入口 oidc-release.yml（MR 合入 prerelease / release 时按目标分支发布），增加 npm 11.21.1 与 id-token: write，publish 拆为 version 与 from-package，移除 NPM_TOKEN 发布注入；保留 Node 22、pnpm 10.33.0、[skip ci] 和 Git 回推逻辑。npm 可信发布者配置及远端生效状态见批次 o5mvzb 的 PROGRESS；本地配置不代表 request 已完成 OIDC MR 实发。
- 鉴权、重试策略、提示渲染及缓存后端由调用方配置或宿主承担；当前实现不提供业务领域 verdict。
- 日志为公共 debug 工具，缓存为注入接口；无数据库、部署或迁移约束。
