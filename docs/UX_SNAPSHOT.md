# UI/UX 规范快照

> 文档定位：快照 · 适用于整个请求 SDK；最后核验：2026-10-28。

## ⓐ 设计系统概览

这是 SDK 的开发者体验快照；没有产品 GUI。API 从各包 src/index.ts 导出，调用方式与示例见各包 README。

## ⓑ 色彩规范

无产品色彩系统；调试日志实现见 packages/base/src/debug.ts，不视为界面配色规范。

## ⓒ 字体规范

无产品字体系统；SDK 不管理宿主字体。

## ⓓ 间距与布局

无产品布局；包根 index.html 是开发调试宿主，未作为产品界面。

## ⓔ 组件规范

无 UI 组件系统；公开交互契约由 TypeScript 声明提供，入口见各包 package.json 的 exports。

## ⓕ 交互规范

开发者通过 createRequest、配置对象与 Promise 交互；错误处理及可选展示回调的当前细节见 [request 领域快照](governance/modules/request/SNAPSHOT.md#ux-快照)。

## ⓖ 图标规范

无 SDK 图标资产或图标约定。

## ⓗ 无障碍规范

SDK 不直接渲染 UI；Toast 可访问性由宿主 showToast 实现承担，仓内未核验到无障碍测试。

## ⓘ 已知设计债务

没有核验到统一 API 文档生成或文档示例执行门禁；README 的描述应与源码交叉核对，不能仅据文案断言行为。
