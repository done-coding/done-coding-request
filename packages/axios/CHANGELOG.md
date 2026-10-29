# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 1.2.4-alpha.0 (2026-10-29)

### Bug Fixes

- **axios:** 修复request入参类型 ([34f19c9](https://github.com/done-coding/done-coding-request/commit/34f19c9cbd95f0f4a4dceb0b06c85f6593dc5848))
- **base:** dispatchBusinessResult ([709a28f](https://github.com/done-coding/done-coding-request/commit/709a28f370e99d76dd65e3c1e0540065dcf0c1f8))
- 撤销分化包固定基础包版本(lerna不会替换为具体版本号) ([6582cd0](https://github.com/done-coding/done-coding-request/commit/6582cd016aa35603e94163b8c5ecb07788d99bde))

### Features

- **axios:** axios外部提供 ([9ca725e](https://github.com/done-coding/done-coding-request/commit/9ca725ed2ffd9048e27af7b373f7553ef1880b47))
- **base:** isSuccessBusinessCode & isSuccessNetworkCode ([f29bb79](https://github.com/done-coding/done-coding-request/commit/f29bb79157e5bf56f3664bee4fc056927d553bec))
- **base:** isSuccessBusinessCode提供第二个形参 ([93b602c](https://github.com/done-coding/done-coding-request/commit/93b602cf0c43d355ea01d97d9f9e1692cc846281))
- **base:** 成功的标准数据增加\_raw 即原始业务数据、各实例化包固定base包版本 ([9049367](https://github.com/done-coding/done-coding-request/commit/90493679e4f0b4dad41925444cbe584f59db0800))
- base配置重新设计 & 继承base的axios版，uni版 ([17efedb](https://github.com/done-coding/done-coding-request/commit/17efedb39f4984ee25c69f91c012d47da5d2337d))
- dealError => beforeError & beforeError + showToast设置为非必需 ([2396713](https://github.com/done-coding/done-coding-request/commit/23967135b57714ff84175e18d5aeb7cd443f9e90))
- **ofetch:** ofetch主体流程 ([d7c2d57](https://github.com/done-coding/done-coding-request/commit/d7c2d577fa400a517741efc3f650939197ce0cdd))
- **request:** 兼容标准 HTTP 错误格式（显式开启），发布流程对齐模板 ([#1](https://github.com/done-coding/done-coding-request/issues/1)) ([d295a35](https://github.com/done-coding/done-coding-request/commit/d295a3531cbccc33ecb2445230a7ed5610a5aaf8))
- 增加debug参数 开始后可以输出各阶段执行结果 ([1f68313](https://github.com/done-coding/done-coding-request/commit/1f68313bccec3f1ef94e752e484ddaf56bd372f6))
- 请求出错处理及各阶段外部函数执行错误捕捉处理&axios额外增加实例创建选项 ([cf83a08](https://github.com/done-coding/done-coding-request/commit/cf83a0839995fd34b41cf136fa1dfed0e80a1335))
- 错误message优先取Error实例的 & debug由实例属性更改为调用request第二个参数 ([a0dd1e5](https://github.com/done-coding/done-coding-request/commit/a0dd1e560ba26b84124435694b3f19aea70a8d55))
- 错误使用继承Error的子类 & 根据是否为该子类避免二次更改错误类型 ([3008c7c](https://github.com/done-coding/done-coding-request/commit/3008c7cdf985c0f0fbdba8374c1473bfa5f8b5f3))

### Performance Improvements

- 外置依赖axios、ofetch,及lodash引用更细化，打包文件优化、导出结果优化 ([7d8ebd3](https://github.com/done-coding/done-coding-request/commit/7d8ebd3568bb6a051694e3349847ec24778558e0))
- 开发启动命令 ([fceb9ee](https://github.com/done-coding/done-coding-request/commit/fceb9eec0440f74b3a79bf79810df75848d73cd1))
