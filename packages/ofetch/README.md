# @done-coding/request-ofetch

`@done-coding/request-ofetch` 是基于 [@done-coding/request-base](../base/README.md) 的 ofetch 请求封装，提供了统一的请求处理流程和错误处理机制。

## 安装

```bash
# 使用 npm
npm install @done-coding/request-ofetch ofetch

# 使用 yarn
yarn add @done-coding/request-ofetch ofetch

# 使用 pnpm
pnpm add @done-coding/request-ofetch ofetch
```

> 注意：如果项目中已经安装了 `ofetch`，可以跳过安装 `ofetch` 依赖。

## 使用方法

### 基础配置

```typescript
import { ofetch } from "ofetch";
import { createRequest } from "@done-coding/request-ofetch";

// 创建请求实例
const request = createRequest({
  basePath: "https://api.example.com",
  timeout: 5000,
  // 必须传入 ofetch 实例
  Fetch: ofetch,
  // 业务数据处理函数
  getBusinessCode: (res) => res.code,
  getBusinessMsg: (res) => res.message,
  getBusinessData: (res) => res.data,
  // 业务成功状态码列表
  businessSuccessCodeList: [200],
  // 请求拦截器
  beforeRequest: (config) => {
    // 可以修改请求配置
    return config;
  },
  // 错误处理
  beforeError: (error, { apiConfig, extendConfig }) => {
    if (error.isBusinessError) {
      return {
        newError: error,
        canShowErrorToast: true,
      };
    }
    return {
      newError: error,
      canShowErrorToast: true,
    };
  },
});

// 发起请求
const response = await request({
  url: "/api/data",
  method: "GET",
  params: { id: 1 },
});
```

### 高级配置

```typescript
import { ofetch } from "ofetch";
import { createRequest } from "@done-coding/request-ofetch";

// 创建 ofetch 实例
const ofetchInstance = ofetch.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 创建请求实例
const request = createRequest({
  basePath: "https://api.example.com",
  timeout: 5000,
  // 必须传入 ofetch 实例
  ofetch: ofetchInstance,
  // 实例创建选项
  instanceCreateConfig: {
    // 可以传入 ofetch.create 的配置项
    headers: {
      Authorization: "Bearer token",
    },
  },
  // 业务数据处理函数
  getBusinessCode: (res) => res.code,
  getBusinessMsg: (res) => res.message,
  getBusinessData: (res) => res.data,
  // 业务成功状态码列表
  businessSuccessCodeList: [200],
  // 网络成功状态码列表
  networkSuccessCodeList: [200, 201, 202],
  // 请求拦截器
  beforeRequest: (config) => {
    // 可以修改请求配置
    return config;
  },
  // 错误处理
  beforeError: (error, { apiConfig, extendConfig }) => {
    if (error.isBusinessError) {
      return {
        newError: error,
        canShowErrorToast: true,
      };
    }
    return {
      newError: error,
      canShowErrorToast: true,
    };
  },
  // 错误提示
  showToast: (message) => {
    console.error(message);
  },
  // UI配置
  uiConfig: {
    errorToast: true,
  },
  // 缓存配置
  cacheConfig: {
    useCache: true,
  },
  // 缓存选项配置
  cache: {
    getKey: (config) => `${config.url}-${JSON.stringify(config.params)}`,
    setCache: async (key, data, config) => {
      // 实现缓存存储逻辑
      // data: 请求结果
      // config: 缓存配置
    },
    getCache: async (key) => {
      // 实现缓存获取逻辑
      return undefined;
    },
  },
});

// 发起请求
const response = await request({
  url: "/api/data",
  method: "GET",
  params: { id: 1 },
  // 请求级别缓存配置
  cacheConfig: {
    useCache: true,
  },
});
```

## 标准错误与兼容配置

**默认关闭标准错误解析，保留 1.2.3 的非成功 HTTP 行为**：不调用业务 getter，返回 `RequestFailResultNetwork`，`isBusinessError=false`，`code` 为 HTTP 状态码。Axios / ofetch 的 `message` 保留 `statusText`（包括空字符串，不补 `HTTP <status>`）；uni 保留 `errMsg`，仅在其为 `undefined` 时使用状态码字符串。新增的 `httpStatus`、`kind` 等是附加信息。2xx 的成功与业务失败判定不变。

需要标准解析时，从当前包导入 `getErrorFromResponse`，在已有配置中加一行 `getErrorFromResponse: getErrorFromResponse`（也可用同名属性简写）：

```ts
import { getErrorFromResponse } from "@done-coding/request-ofetch";

const options = {
  // ...原有配置（业务 getter 等）
  getErrorFromResponse: getErrorFromResponse,
};
```

显式开启后，非成功 HTTP 才使用 `getBusinessCode` / `getBusinessMsg` 读取包体业务码、文案；`error.retryable`、`error.outcome`（`not_executed` / `unknown`）、`error.fields` 原样保留合法类型。标准失败包体示例：

```json
{
  "code": "ORDER_NOT_FOUND",
  "message": "订单不存在",
  "data": null,
  "error": { "retryable": false, "outcome": "not_executed", "fields": [] },
  "requestId": "req-1"
}
```

可选的 `getErrorFromResponse(response, getters)` 仅处理非成功 HTTP：`response` 为 `{ status, statusText, body }`；三个 `getters` 接收包体，并自动适配到现有业务 getter 的入参。标准实现作为同名函数导出，必须传入配置才生效。特殊包体可覆盖此配置，通过 `getters.getBusinessCode(body)`、`getters.getBusinessMsg(body)`、`getters.getBusinessData(body)` 复用取值方法，返回 `{ code?, message?, retryable?, outcome?, fields? }`。显式配置的解析器返回 `undefined`、业务码缺失或抛错时按 HTTP 状态码兜底；此时文案缺失使用 `statusText` 或 `HTTP <status>`（uni 没有标准 statusText）。

`beforeError` 与最终错误都可读取 `httpStatus`、`retryable`、`outcome`、`fields`、`requestId`、`cause` 和 `kind`：`http` 为非成功 HTTP，`business` 为成功 HTTP 下业务失败，`network` 为无响应或传输失败。`code` 仍是业务码或兜底码，`message` 仍是提示文案；取得业务码时 `isBusinessError=true`，HTTP 兜底与网络错误为 `false`。不要仅凭 `isBusinessError=false` 判断断网，应查看 `kind`。

保留独立 bug 修复：ofetch 已收到 HTTP 响应时优先使用该响应，即使 `navigator.onLine=false`，也不再报 `NO_RESPONSE_OFFLINE`。这与是否开启标准解析无关，是相对 1.2.3 的已知差异。

HTTP 200 的旧后端继续只按已有 `businessSuccessCodeList` / `isSuccessBusinessCode` 判断成功，不调用新解析器；成功 HTTP 默认包含整个 2xx 区间，201 的成功包体业务码仍为 200。成功结果的可选 `_response` 保留 `{ status, statusText, headers }`（含 Location 等响应头），`_raw` 保持原形状；无响应错误不伪造 `httpStatus`。`retryable` 不会触发自动重试。

ofetch 从 `response.status` / `statusText` / `_data` 取得失败响应；现有业务 getter 仍直接接收包体，成功 `_raw` 也是包体。

## 特性

- 🔄 **统一的请求处理流程**：基于 base 包的统一请求处理流程
- 📦 **统一的数据结构**：所有请求响应都会被统一处理，确保进入 then 的数据结构一致
- ✅ **自动的状态码处理**：自动处理业务状态码，只有在成功状态下才会进入 then
- 🛡️ **统一的错误处理**：所有错误都会被统一捕获和处理，进入 catch 的错误都是经过处理的
- 🔍 **可预测的结果**：保证请求结果的可预测性，减少重复的状态码判断
- 🔄 **请求重试机制**：支持请求失败后的自动重试
- 🧠 **缓存支持**：内置缓存机制，支持自定义缓存策略
- 🐛 **调试支持**：内置调试功能，支持详细的请求生命周期日志

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm dev

# 构建
pnpm build

# 测试
pnpm test
```

## 许可证

MIT

<!-- repo-map:start -->

## 目录导航（自动维护，勿手改段内 — 由项目初始化脚本重跑刷新）

- `src/`：源码
  - `__tests__/`：单元测试（MSW / Vitest）
- `package.json`：公开出口、依赖与包脚本
- `vite.config.ts`：ESM / CJS / 声明构建与 Vitest 配置
- `tsconfig.json`：TypeScript 配置
- `index.html`：本地调试宿主

> 用途：供协作者/AI 按图定位，免遍历目录树。结构变更后重跑初始化刷新。
> （模块根的本段展开该模块**内部**结构；深层大目录 ≥8 项或继续分叉则嵌套列出，叶子小目录不展。）

<!-- repo-map:end -->
