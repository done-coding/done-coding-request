# @done-coding/request-uni

`@done-coding/request-uni` 是基于 [@done-coding/request-base](../base/README.md) 的 uni-app 请求封装，提供了统一的请求处理流程和错误处理机制。

## 安装

```bash
# 使用 npm
npm install @done-coding/request-uni

# 使用 yarn
yarn add @done-coding/request-uni

# 使用 pnpm
pnpm add @done-coding/request-uni
```

## 使用方法

### 基础配置

```typescript
import { createRequest } from '@done-coding/request-uni';

// 创建请求实例
const request = createRequest({
  basePath: 'https://api.example.com',
  timeout: 5000,
  // 业务数据处理函数
  getBusinessCode: (res) => res.data.code,
  getBusinessMsg: (res) => res.data.message,
  getBusinessData: (res) => res.data.data,
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
        canShowErrorToast: true
      };
    }
    return {
      newError: error,
      canShowErrorToast: true
    };
  }
});

// 发起请求
const response = await request({
  url: '/api/data',
  method: 'GET',
  data: { id: 1 }
});
```

### 高级配置

```typescript
import { createRequest } from '@done-coding/request-uni';

// 创建请求实例
const request = createRequest({
  basePath: 'https://api.example.com',
  timeout: 5000,
  // 业务数据处理函数
  getBusinessCode: (res) => res.data.code,
  getBusinessMsg: (res) => res.data.message,
  getBusinessData: (res) => res.data.data,
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
        canShowErrorToast: true
      };
    }
    return {
      newError: error,
      canShowErrorToast: true
    };
  },
  // 错误提示
  showToast: (message) => {
    uni.showToast({
      title: message,
      icon: 'none'
    });
  },
  // UI配置
  uiConfig: {
    errorToast: true
  },
  // 缓存配置
  cacheConfig: {
    useCache: true
  },
  // 缓存选项配置
  cache: {
    getKey: (config) => `${config.url}-${JSON.stringify(config.data)}`,
    setCache: async (key, data, config) => {
      // 实现缓存存储逻辑
      // data: 请求结果
      // config: 缓存配置
    },
    getCache: async (key) => {
      // 实现缓存获取逻辑
      return undefined;
    }
  }
});

// 发起请求
const response = await request({
  url: '/api/data',
  method: 'GET',
  data: { id: 1 },
  // 请求级别缓存配置
  cacheConfig: {
    useCache: true
  }
});
```

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