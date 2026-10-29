# 领域模块目录

> 文档定位：规范 · 适用于本仓代码归属；核验：2026-10-28，依据 git ls-files、四包 package.json 和 src/main.ts。

## 领域模块

| 领域      | 能力与类型                                                       | status | paths                                                                    |
| --------- | ---------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| `request` | 无业务语义的通用请求执行、结果与错误封装、三种传输适配；平台领域 | active | `packages/base/`、`packages/axios/`、`packages/ofetch/`、`packages/uni/` |

## 物理映射依据

ⓐ `packages/base/`：公开请求执行核心、类型、错误、缓存与调试；src 下没有独立业务能力目录。
ⓑ `packages/axios/`：通过 Axios 执行同一请求契约，入口重导出 base。
ⓒ `packages/ofetch/`：通过 ofetch 执行同一请求契约，入口重导出 base。
ⓓ `packages/uni/`：通过 uni.request 执行同一请求契约，入口重导出 base。

四个 git 跟踪的 workspace 物理单元均无业务实体状态机，依据“无业务语义的共享技术件默认合为一个平台领域”合并为 request；没有按包或技术平台另造业务领域。
每份 packages/ 下的已跟踪代码恰归 request 一次，测试与调试宿主随其包归属；盘面构建残留不作为映射证据。

## 共享骨架与横向领域

根 package.json、pnpm-workspace.yaml、pnpm-lock.yaml、lerna.json、tsconfig.json、格式与提交钩子配置为共享工程骨架；涉及修改时在批次 PROGRESS 声明具体文件独占。
根 README、规则和 docs/ 为跨领域说明与治理资料，本轮不修改任何代码文件。
没有已核验的横向串行代码操作；横向调度不计入批次 modules。
