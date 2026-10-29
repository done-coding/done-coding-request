# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 1.2.4-alpha.0 (2026-10-29)

### Bug Fixes

- **base:** dispatchBusinessResult ([709a28f](https://github.com/done-coding/done-coding-request/commit/709a28f370e99d76dd65e3c1e0540065dcf0c1f8))
- **ofetch:** 修复类型 ([a978378](https://github.com/done-coding/done-coding-request/commit/a978378ed1ead8fed17afee29ff9da54630a6f40))
- **ofetch:** 对ofetch mts文件类型打包移植问题 ([8e5f5b4](https://github.com/done-coding/done-coding-request/commit/8e5f5b4ec0616394cb3d89ce38c5c3e54b780601))
- **ofetch:** 类型FetchOptions ([6a9cc50](https://github.com/done-coding/done-coding-request/commit/6a9cc50d9a4600ccd73410334cb7ee6b2400a168))
- **ofetch:** 类型FetchOptions补上method ([9c9c497](https://github.com/done-coding/done-coding-request/commit/9c9c4971387a3c505b3fe8a4b44b79bfecd448fd))
- **ofetch:** 返回的数据结构及请求地址设置 ([de5ee2c](https://github.com/done-coding/done-coding-request/commit/de5ee2c3abf22b234c342b3207510c144c7a4a16))
- 撤销分化包固定基础包版本(lerna不会替换为具体版本号) ([6582cd0](https://github.com/done-coding/done-coding-request/commit/6582cd016aa35603e94163b8c5ecb07788d99bde))

### Features

- **base:** isSuccessBusinessCode提供第二个形参 ([93b602c](https://github.com/done-coding/done-coding-request/commit/93b602cf0c43d355ea01d97d9f9e1692cc846281))
- **base:** 成功的标准数据增加\_raw 即原始业务数据、各实例化包固定base包版本 ([9049367](https://github.com/done-coding/done-coding-request/commit/90493679e4f0b4dad41925444cbe584f59db0800))
- **ofetch:** ofetch主体流程 ([d7c2d57](https://github.com/done-coding/done-coding-request/commit/d7c2d577fa400a517741efc3f650939197ce0cdd))
- **request:** 兼容标准 HTTP 错误格式（显式开启），发布流程对齐模板 ([#1](https://github.com/done-coding/done-coding-request/issues/1)) ([d295a35](https://github.com/done-coding/done-coding-request/commit/d295a3531cbccc33ecb2445230a7ed5610a5aaf8))

### Performance Improvements

- 外置依赖axios、ofetch,及lodash引用更细化，打包文件优化、导出结果优化 ([7d8ebd3](https://github.com/done-coding/done-coding-request/commit/7d8ebd3568bb6a051694e3349847ec24778558e0))
- 开发启动命令 ([fceb9ee](https://github.com/done-coding/done-coding-request/commit/fceb9eec0440f74b3a79bf79810df75848d73cd1))
