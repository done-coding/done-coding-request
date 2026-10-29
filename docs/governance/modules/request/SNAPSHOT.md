# request 领域现状

> 文档定位：快照 · 适用于 MODULES.md 所列 request 代码路径；核验：2026-10-29，运行时依据批次 o9pt1n（R-OPTIN），发布配置依据 R-REL。

## 技术快照

公共入口为 base 的 src/index.ts 及三个适配器的 src/index.ts，适配器重导出 base，依赖单向指向 base。
RequestResult 保留 code、data、message、\_raw，成功响应可带 `_response={status,statusText,headers}`，保留 Location 等响应元信息且不改变 \_raw 的既有形状。
RequestFailResult 保留 code、message、isBusinessError，新增可选 httpStatus、retryable、outcome、fields、kind、requestId；业务错误可带 cause，Network 的 cause 保持必有 unknown（未传入时值为 undefined），beforeError 可读取这些字段，回传普通对象再包装后仍保留。
非成功 HTTP 统一经 createHttpError：Axios 取 response.status/statusText/data，ofetch 取 response.status/statusText/\_data，uni 取 statusCode/data（无标准 statusText，传空字符串）。默认不调用非成功 HTTP 解析器及业务 getter，保留 1.2.3 的 Network 错误类、isBusinessError=false、HTTP code；Axios/ofetch 文案为 statusText（含空字符串），uni 为 errMsg（undefined 才用状态码字符串）。显式配置 getErrorFromResponse: getErrorFromResponse 后复用调用方 getter 取业务码和文案；error.retryable/outcome/fields 为额外信息，requestId 在根上。显式解析无法取得业务码或抛错时按 HTTP 状态兜底，文案使用 statusText 或 HTTP <status>。四包公开入口均导出标准解析器。
kind=http 表示非成功 HTTP，business 表示成功 HTTP 下业务失败，network 表示无响应或传输失败；取得业务码时 isBusinessError=true，HTTP 兜底与网络错误为 false。无响应错误不伪造 httpStatus。保留两项与开启选项无关的 bug 修复：uni request:fail timeout 不再被覆盖为 NO_NETWORK_CODE，ofetch 已收到响应优先于 navigator 离线状态；这是相对 1.2.3 的明确例外。
Request 合并全局与单次 uiConfig/cacheConfig，调用 issue；beforeError 可返回 reload 或新的错误与提示许可；缓存读取与写入由注入函数完成，retryable 本身不触发重试。
测试沿用 Vitest/MSW，uni 原有集成测试使用 mock-uni-env/jsdom；共用矩阵位于 tests/standard-error-contract.ts（显式开启）与 tests/default-error-contract.ts（默认兼容）。204 项测试通过：base 2、Axios 71、ofetch 64、uni 67；旧源码 fb7514b 实跑确认默认矩阵中 66 项旧行为一致及两项已知 bug 修复差异。base 标准解析器另由 Axios 套件通过公开入口验证；四包 tsc（含 cause 必有属性结构赋值）、改动代码 ESLint 与 Lerna 四包构建通过。

发布配置采用 template-hub monorepo 碎片：Lerna independent + pnpm + conventionalCommits；排除 Markdown 和指定测试路径，workspace 排除 uni_modules。release PR 合入触发稳定版发布，prerelease PR 合入发布 alpha；本地配置核验不代表 GitHub Secrets、远端分支或真实发包已验证。用户操作与预测见 [R-REL 进度](../../schedule/t8el29-release-template-alignment/PROGRESS.md)。

## 业务快照

本领域提供传输无关的请求调用与返回结果，没有业务实体或持久业务状态。默认网络成功区间为 200–299，可用成功码列表或谓词覆盖。
业务取值方法 getBusinessCode/getBusinessMsg/getBusinessData 由调用方提供；默认业务成功码列表为 [200]，可用谓词覆盖。HTTP 201 成功包体仍使用业务码 200。
标准失败包体使用真实 HTTP 4xx/5xx，根 code 为字符串业务码，error 只承载 retryable、outcome（not_executed/unknown）和 fields；fields 的 body JSON Pointer 与 query/path/header 参数名不改写。
恒 200 老后端继续按原业务成功条件工作，不调用非成功 HTTP 解析器。宿主负责鉴权、批准、重试及缓存策略，本包不提供业务 verdict，也不从 message 猜业务原因。

## UX 快照

无产品 UI 面。开发者以 createRequest 创建函数，用泛型指定数据类型并消费 Promise。
可选 showToast 由应用注入，uiConfig.errorToast 控制提示；beforeError 可改变最终提示或重新请求。debug 参数输出阶段日志，详细枚举与格式见 base/src/debug.ts。
四包 README 已说明默认兼容行为、显式开启标准解析的一行配置、已知 bug 修复差异、错误字段与各传输响应来源；细节以导出类型和源码为准。测试覆盖本机模拟传输，不代替真实网关、设备或跨仓宿主联调。
