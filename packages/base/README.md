# @done-coding/request-base

`@done-coding/request-base` 是一个请求库的基础包，提供了统一的请求配置接口和响应数据结构。本包主要关注于**业务层面的请求处理**，而不是底层网络请求的实现。

## ⚠️ 使用建议

**不建议直接使用本包**，而是根据具体场景使用对应的细化包：

- 在 uni-app 项目中使用 [@done-coding/request-uni](./../uni/README.md)
- 在 axios 项目中使用 [@done-coding/request-axios](./../axios/README.md)
- 在 ofetch 项目中使用 [@done-coding/request-ofetch](./../ofetch/README.md)

这些细化包已经基于本包进行了完整的封装，提供了更好的类型支持和更简单的使用方式。直接使用本包需要自行处理很多细节，建议使用对应的场景化包。

**如果以上场景化包不再满足需求**，可以使用本包进行自定义封装，例如：

- 需要支持其他请求库（如 fetch、XMLHttpRequest 等）
- 需要特殊的请求处理逻辑
- 需要自定义的响应处理方式

## 标准错误与兼容配置

**默认关闭标准错误解析，保留 1.2.3 的非成功 HTTP 行为**：不调用业务 getter，返回 `RequestFailResultNetwork`，`isBusinessError=false`，`code` 为 HTTP 状态码。Axios / ofetch 的 `message` 保留 `statusText`（包括空字符串，不补 `HTTP <status>`）；uni 保留 `errMsg`，仅在其为 `undefined` 时使用状态码字符串。新增的 `httpStatus`、`kind` 等是附加信息。2xx 的成功与业务失败判定不变。

需要标准解析时，从当前包导入 `getErrorFromResponse`，在已有配置中加一行 `getErrorFromResponse: getErrorFromResponse`（也可用同名属性简写）：

```ts
import { getErrorFromResponse } from "@done-coding/request-base";

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

保留独立 bug 修复：uni 的 `request:fail timeout` 使用 `NO_RESPONSE_TIMEOUT`，不再被后续平台分支覆盖成 `NO_NETWORK_CODE`。保留独立 bug 修复：ofetch 已收到 HTTP 响应时优先使用该响应，即使 `navigator.onLine=false`，也不再报 `NO_RESPONSE_OFFLINE`。这与是否开启标准解析无关，是相对 1.2.3 的已知差异。

HTTP 200 的旧后端继续只按已有 `businessSuccessCodeList` / `isSuccessBusinessCode` 判断成功，不调用新解析器；成功 HTTP 默认包含整个 2xx 区间，201 的成功包体业务码仍为 200。成功结果的可选 `_response` 保留 `{ status, statusText, headers }`（含 Location 等响应头），`_raw` 保持原形状；无响应错误不伪造 `httpStatus`。`retryable` 不会触发自动重试。

自定义传输适配器可使用导出的 `createHttpError` 归一化失败响应；已有三个适配器已接通。

## 测试策略

本包采用间接测试策略，通过各细化包的实际应用来验证功能的正确性：

- 各细化包（axios、ofetch、uni）的应用本身就是对 base 包最完整的集成测试
- 每个细化包都有其专门的单元测试，这些测试覆盖了：
  - 基于 base 包的功能实现
  - 特定场景下的功能验证
  - 边界条件和错误处理
  - 类型定义和类型推导
- 通过这种方式，base 包的功能得到了更实际和全面的验证

## 核心特性

- 🔄 **统一的请求处理流程**：无论使用哪种请求客户端，都保证相同的请求处理流程
- 📦 **统一的数据结构**：所有请求响应都会被统一处理，确保进入 then 的数据结构一致
- ✅ **自动的状态码处理**：自动处理业务状态码，只有在成功状态下才会进入 then
- 🛡️ **统一的错误处理**：所有错误都会被统一捕获和处理，进入 catch 的错误都是经过处理的
- 🔍 **可预测的结果**：保证请求结果的可预测性，减少重复的状态码判断
- 🔄 **请求重试机制**：支持请求失败后的自动重试
- 🧠 **缓存支持**：内置缓存机制，支持自定义缓存策略
- 🐛 **调试支持**：内置调试功能，支持详细的请求生命周期日志

## 基于此包扩展的子包

所有基于此包扩展的子包都保证：

- 统一的请求处理流程
- 一致的数据结构返回
- 自动的状态码处理
- 统一的错误处理机制
- 可预测的请求结果

可用的实现：

- [@done-coding/request-axios](./../axios/README.md) - 基于 axios 的请求拦截器实现
- [@done-coding/request-ofetch](./../ofetch/README.md) - 基于 ofetch 的请求拦截器实现
- [@done-coding/request-uni](./../uni/README.md) - 基于 uni-app 的请求拦截器实现

## 安装

```bash
# 使用 npm
npm install @done-coding/request-base

# 使用 yarn
yarn add @done-coding/request-base

# 使用 pnpm
pnpm add @done-coding/request-base
```

## 配置策略

本包支持全局配置和请求时配置，并且有默认策略和合并策略：

### 核心配置项

#### issue（必选）

`issue` 是base包最核心的配置项，它定义了如何发起实际的网络请求。这个函数需要实现具体的请求逻辑，并返回统一格式的响应。

```typescript
const request = createRequest({
  basePath: 'https://api.example.com',
  // 核心配置：如何发起请求
  issue: async <D>(config: IssueConfig<C>, extendConfig: ExtendConfig) => {
    // config 包含请求配置
    // - url: 请求地址
    // - method: 请求方法
    // - data: 请求数据
    // - headers: 请求头
    // - BASE_PATH: 基础路径（由basePath生成）
    // - TIMEOUT: 超时时间（由timeout生成）
    // - DEBUG: 是否开启调试
    // - ... 其他自定义配置

    // extendConfig 包含扩展配置
    // - uiConfig: UI相关配置
    //   - errorToast: 是否显示错误提示
    // - cacheConfig: 缓存相关配置
    //   - useCache: 是否使用缓存

    // 返回统一格式的响应
    return {
      code: number | string,  // 业务状态码
      data: D,               // 业务数据（泛型类型）
      message: string        // 业务消息
      _raw: any,             // 原始响应数据（1.2.2 考虑会存在情况: 有的接口存在在业务码这一层级还返回其他的 如分页信息 而不是全部放到data里 如果访问建议只访问非data的其他属性）
    };
  }
});
```

issue 函数的特点：

1. **必选配置**：必须提供此配置才能创建请求实例
2. **统一响应格式**：必须返回统一格式的响应对象（RequestResult<D>）
3. **完整配置信息**：可以访问所有请求相关的配置
4. **灵活实现**：可以根据需要实现任何请求库的调用
5. **错误处理**：如果请求过程中发生错误，会被自动捕获并转换为统一的错误格式
6. **类型安全**：支持泛型类型，可以指定返回数据的类型

issue 函数的错误处理：

- 如果请求过程中发生错误，会被自动转换为 RequestFailResult 类型
- 网络错误会被转换为 RequestFailResultNetwork
- 业务错误会被转换为 RequestFailResultBusiness
- 可以通过 beforeError 配置来自定义错误处理逻辑

### 全局配置

在创建请求实例时配置，会应用到所有请求：

```typescript
const request = createRequest({
  basePath: "https://api.example.com",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
  // 其他全局配置...
});
```

### 请求时配置

在发起请求时配置，只会应用到当前请求：

```typescript
const response = await request({
  url: "/api/data",
  method: "GET",
  timeout: 3000, // 覆盖全局配置
  headers: {
    Authorization: "Bearer token", // 合并到全局配置
  },
});
```

### 默认策略

部分配置项有默认值：

- `timeout`: 默认 1000ms
- `beforeRequest`: 默认返回原始配置
- `isSuccessNetworkCode`: 默认判断 code >= 200 && code < 300
- `uiConfig.errorToast`: 默认 true

### 合并策略

配置的合并遵循以下规则：

1. **请求配置**：请求时配置会覆盖全局配置
2. **headers**：请求时的 headers 会与全局 headers 合并
3. **拦截器**：拦截器会按顺序执行，全局拦截器先执行
4. **UI配置**：请求时的 UI 配置会覆盖全局 UI 配置
5. **缓存配置**：请求时的缓存配置会覆盖全局缓存配置

## 缓存配置

缓存配置支持全局和请求级别，并且可以自定义缓存策略：

### 全局缓存配置

```typescript
const request = createRequest({
  basePath: "https://api.example.com",
  cacheConfig: {
    // 生成缓存键
    getKey: (config) => `${config.url}-${JSON.stringify(config.params)}`,
    // 设置缓存
    setCache: async (key, data, config) => {
      // 实现缓存存储逻辑
      // 只有在业务成功时才会调用
    },
    // 获取缓存
    getCache: async (key) => {
      // 实现缓存获取逻辑
      return undefined;
    },
  },
  // 默认启用缓存
  useCache: true,
});
```

### 请求级别缓存配置

```typescript
const response = await request({
  url: "/api/data",
  method: "GET",
  // 覆盖全局缓存配置
  cacheConfig: {
    useCache: false, // 禁用当前请求的缓存
  },
});
```

### 缓存配置

```typescript
import { createRequest } from "@done-coding/request-base";

const request = createRequest({
  basePath: "https://api.example.com",
  // 缓存配置
  cacheConfig: {
    useCache: true,
  },
  // 缓存选项配置
  cache: {
    getKey: (config) => `${config.url}-${JSON.stringify(config.params)}`,
    setCache: async (key, data) => {
      // 实现缓存存储逻辑
    },
    getCache: async (key) => {
      // 实现缓存获取逻辑
      return undefined;
    },
  },
});

// 使用缓存
const response = await request({
  url: "/api/data",
  method: "GET",
  cacheConfig: {
    useCache: true,
  },
});
```

### 缓存策略说明

1. **缓存配置**：

   - `cacheConfig`: 控制是否使用缓存
     - `useCache`: 是否启用缓存
   - `cache`: 缓存的具体实现
     - `getKey`: 生成缓存键
     - `setCache`: 存储缓存
     - `getCache`: 获取缓存

2. **缓存键生成**：

   - 通过 `cache.getKey` 函数生成缓存键
   - 默认使用 URL 和参数组合生成
   - 支持自定义生成策略

3. **缓存存储**：

   - 通过 `cache.setCache` 函数存储缓存
   - 只有在业务成功时才会调用
   - 支持异步存储操作

4. **缓存获取**：

   - 通过 `cache.getCache` 函数获取缓存
   - 支持异步获取操作
   - 返回 undefined 表示无缓存

5. **缓存控制**：
   - 通过 `cacheConfig.useCache` 控制是否使用缓存
   - 支持全局和请求级别控制
   - 请求级别配置优先级高于全局配置

## API

### createRequest

创建一个请求实例。

```typescript
function createRequest(options: Options): RequestFunction;
```

#### 参数

- `options`: 请求配置选项
  - `basePath`: 基础URL
  - `timeout`: 超时时间
  - `headers`: 请求头
  - `beforeRequest`: 请求拦截器
  - `beforeResponse`: 响应拦截器
  - `beforeError`: 错误拦截器
  - `uiConfig`: UI交互配置
  - `cacheConfig`: 缓存配置

#### 返回值

返回一个请求函数，可以用于发起请求。

## 使用示例

### 基础配置

```typescript
import { createRequest } from "@done-coding/request-base";

const request = createRequest({
  basePath: "https://api.example.com",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 发起请求
const response = await request({
  url: "/api/data",
  method: "GET",
  params: { id: 1 },
});
```

### 错误处理

```typescript
import { createRequest } from "@done-coding/request-base";

const request = createRequest({
  basePath: "https://api.example.com",
  beforeError: (error) => {
    if (error.isBusinessError) {
      // 处理业务错误
      return {
        newError: error,
        canShowErrorToast: true,
      };
    }
    // 处理网络错误
    return {
      newError: error,
      canShowErrorToast: true,
    };
  },
});

try {
  const response = await request({
    url: "/api/data",
    method: "GET",
  });
} catch (error) {
  // 错误已经被 beforeError 处理
  console.error(error);
}
```

### 缓存配置

```typescript
import { createRequest } from "@done-coding/request-base";

const request = createRequest({
  basePath: "https://api.example.com",
  // 缓存配置
  cacheConfig: {
    useCache: true,
  },
  // 缓存选项配置
  cache: {
    getKey: (config) => `${config.url}-${JSON.stringify(config.params)}`,
    setCache: async (key, data) => {
      // 实现缓存存储逻辑
    },
    getCache: async (key) => {
      // 实现缓存获取逻辑
      return undefined;
    },
  },
});

// 使用缓存
const response = await request({
  url: "/api/data",
  method: "GET",
  cacheConfig: {
    useCache: true,
  },
});
```

## 最佳实践

### 错误处理

- 使用 `beforeError` 统一处理错误
- 区分业务错误和网络错误
- 根据错误类型显示不同的提示信息

### 请求拦截

- 在请求前统一处理请求配置
- 添加通用请求头
- 处理请求参数

### 响应拦截

- 统一处理响应数据
- 转换响应格式
- 处理特殊响应

### 缓存策略

- 合理设置缓存键
- 控制缓存生命周期
- 及时清理过期缓存

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
- `package.json`：公开出口、依赖与包脚本
- `vite.config.ts`：ESM / CJS / 声明构建与 Vitest 配置
- `tsconfig.json`：TypeScript 配置
- `index.html`：本地调试宿主

> 用途：供协作者/AI 按图定位，免遍历目录树。结构变更后重跑初始化刷新。
> （模块根的本段展开该模块**内部**结构；深层大目录 ≥8 项或继续分叉则嵌套列出，叶子小目录不展。）

<!-- repo-map:end -->
