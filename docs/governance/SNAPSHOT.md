# 治理组合快照

> 文档定位：快照 · 适用于本仓领域组合；核验：2026-10-29。

## 领域摘要

- [request](modules/request/SNAPSHOT.md)：公共请求运行时与 Axios、ofetch、uni.request 三种适配，代码归属见 MODULES.md。

## 依赖与契约

包依赖方向为三个适配器 → base；适配器不相互导入。调用方负责传入响应提取函数，传输层负责发起请求，公共层负责结果分发、缓存与错误钩子。
公共类型细节见领域快照；项目全貌见上一级三份快照，不在此重列清单声明版本。

## 全局技术基线

- 根 ESLint / Prettier 配置供四包继承；lint-staged 仅匹配代码扩展名，Markdown 须独立检查。
- Vite 为库产出 ESM、CJS，vite-plugin-dts 产出声明；已跟踪 release/prerelease 发布工作流，操作边界见 [R-REL 进度](schedule/t8el29-release-template-alignment/PROGRESS.md)。
- 鉴权、重试策略、提示渲染及缓存后端由调用方配置或宿主承担；当前实现不提供业务领域 verdict。
- 日志为公共 debug 工具，缓存为注入接口；无数据库、部署或迁移约束。
