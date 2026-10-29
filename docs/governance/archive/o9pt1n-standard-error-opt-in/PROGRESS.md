---
id: o9pt1n
title: R-OPTIN 标准错误解析显式开启
modules: [request]
created: 2026-10-29
source: 用户任务 R-OPTIN / r7op3n / blueprint W1-R
after: ""
---

# R-OPTIN 实施与验证

> 文档定位：记录 · 本批计划、授权边界、证据与交付；仅本仓，不 push、不发版。

## 目标与来源

需求 r7op3n 已入池后下发本批（新文件尚未跟踪，以普通文件移动，唯一正文不复制）。依据为兼容性报告 `~/Documents/code/blueprint/reviews/2026-10-29-request-1.3-downstream-compat.md`、路线 `~/Documents/code/blueprint/snapshot/cross-repo-route.md` 波一 W1-R / 波三发布阻塞、决策 `~/Documents/code/blueprint/decisions/0018-resource-spec-v0-trial.md` ⓒ 及其试验稿末尾修订。本仓 W1-R 归档为 `docs/governance/archive/w1r0rk-standard-error/PROGRESS.md`。

初始实测：master / 57f4b05，git status 为空；Node v22.22.2、pnpm 10.33.2。读取 fb7514b 的旧实现，确认默认解析器、空 statusText 兜底和 cause 可选三处回归。复用本仓 createHttpError、错误类、已装 Vitest / Axios / ofetch，不引入外部代码或依赖，属现有抽象修复，免造轮子检索。

## 执行计划与验收

用户已明确实现方案、无人值守执行方法和提交边界；按本批进度执行，不另设等待批准或工作树。接口只有 createHttpError 的兼容文案参数与 Network.cause 必有属性，其余公共签名不收窄。

- [x] ⓐ 先写三适配器默认兼容矩阵，以 fb7514b 源码实跑确认固定期望，再在 master 验证预期失败；新增 cause 结构赋值编译样例复现 TS2322。
- [x] ⓑ base 默认不调用解析器，未配置文案保留 statusText；uni 传旧 errMsg / 状态码文案。恢复 Network 必有 cause 并初始化。标准矩阵从各包公开入口显式传解析器，空文案与自定义解析失败也验证。
- [x] ⓒ 更新四份 README、类型注释；全量构建后顺序跑四包 Vitest（非监听、超时）、tsc、ESLint；核对产物无跟踪差异、版本和锁文件无差异。
- [ ] ⓓ 独立审阅 diff，修复实质问题；更新领域快照、归档仅留本进度、清单零 diff、治理与格式闸；显式 pathspec 提交并回报 sha。Git 写入受拒则不绕过。

重点：非 2xx getter 副作用、空 statusText、uni 缺失/空 errMsg、非 2xx 包体业务码为 200 仍失败、beforeError 旧分支与标准字段透传、成功路径原始包体形状。

## 两处独立变化判断

ⓐ uni 超时保留为 bug 修复：fb7514b 已在 request:fail timeout 分支明确设置 NO_RESPONSE_TIMEOUT 与“请求超时”，但随后未预处理的平台分支覆盖 code；最终中文文案匹配用于保住该分类。保留 W1-R 修复，明确这是默认兼容的已知例外，固定新旧差异测试，提交正文记录供 CHANGELOG 生成。不声称所有平台真机验证。

ⓑ ofetch 已收到 HTTP 响应时优先响应，保留为 bug 修复：NO_RESPONSE_OFFLINE 字面与旧注释均表示“未响应”，已有 response 时该前提不成立。HTTP 响应是本次请求直接证据，navigator 是全局状态；不能丢掉真实 HTTP 状态。这是默认兼容的第二个明确例外，固定离线且收到响应的测试并记录旧行为。无需修改该分支。

## 证据与进度

- 入池后 lists / check 退出 0；未完成实现、测试与交付。

- 基线实跑：临时 Vite pre-load 插件用 git show fb7514b 加载四包旧源码，base 通过 alias 指向旧源码，传输依赖沿用本地安装版本。三个默认矩阵共 68 项，66 项符合旧版；另外两项准确复现保留修复前的 NO_NETWORK_CODE（uni timeout）与 NO_RESPONSE_OFFLINE（ofetch 已有响应）。没有改写历史代码或其他仓。
- 红灯验证：当前 master 的默认矩阵 Axios 14 failed / 7 passed，ofetch 15 failed / 7 passed，uni 17 failed / 8 passed；失败正是错误类、空/uni 文案与不该触发的 getter。独立 tsc 样例仅报 TS2322：Property 'cause' is optional ... but required in type '{ cause: unknown; }'。
- 测试命令初次使用 Vitest 1.1.1 不支持的 --hookTimeout，已去掉；采用 --testTimeout 5000 加 Python subprocess 180 秒总超时，不下载依赖。测试观察回调改为捕获后断言，避免断言异常被请求层包装为 DEAL_ERROR 掩盖实际值。
- 已最小修改 base 默认解析分支、Network.cause 与 uni 旧文案输入；显式开启路径保持原兜底文案。标准矩阵在各适配器公开 index 导入标准解析器，新增空 statusText 与业务码 200 仍 reject 两项。

## 最终实现验证

- `npx lerna run build` 退出 0，原文：`Successfully ran target build for 4 projects`。构建在测试/类型检查之前完成；产物位于忽略的 es/lib/types，未新增被跟踪的构建文件。构建后工作区仍有本任务待提交源文件，不能称整个工作区已干净。
- 各包执行 `pnpm exec vitest run --testTimeout 5000`（base 另带 --passWithNoTests，但实际运行 2 项，不以空套件当通过；外层 Python subprocess 限时 180 秒）均退出 0：base `Tests 2 passed (2)`；Axios `Tests 71 passed (71)`；ofetch `Tests 64 passed (64)`；uni `Tests 67 passed (67)`。总计 204 项，无跳过。临时运行器与完整日志在 `.scratch/r-optin/`（忽略文件，不进入发布包）。
- 初轮新增空 statusText 标准用例暴露 MSW HttpResponse 自动补标准文案，改用原生 Response 保留空字符串；两个失败已在最终全量验证消除。ofetch 现有 FetchOptions 没列 signal，本批不扩大公共类型，测试通过结构兼容的配置变量注入实际 AbortSignal；tsc 已通过。
- `pnpm -r exec tsc --noEmit` 退出 0、无诊断，包含 `packages/axios/src/__tests__/cause-type.ts` 中报告同款赋值；修复前单独 TS2322 已记录。没有修改其他公开类型的字段约束，仅补 createHttpError 可选 legacyMessage 与配置注释。
- 对本批 14 个 TS 文件执行 `pnpm exec eslint --fix <显式清单>`，修正测试 max-params/no-void 后退出 0；再执行同清单 `pnpm exec eslint <显式清单>` 退出 0、无诊断。未扩大到无关存量代码。
- Node 实际 import 四包 es/index.mjs 及 require lib/index.cjs，8 个入口的 getErrorFromResponse 均为 function，Network 均有 own cause；原文每包 `ESM/CJS 标准解析器导出及 Network.cause OK`。三个标准套件也从各适配器 index 取得解析器显式启用。
- 四个 1.2.3 tag 用 `git rev-parse <tag>^{commit}` 均得到 fb7514b8438bbf73045df202a2198d74c516480a；manifest、锁文件、CHANGELOG 没有 diff。不改版本、不下载依赖、不 push、不发版。
- 工具警告：Vite CJS API deprecated；uni 依赖的 fs.Stats / punycode deprecated；构建 NO_COLOR/FORCE_COLOR 提示。没有把警告写成无输出，也不为此升级依赖。
- 内聚性评估：生产文件均小于 600 行；既有 uni createRequest 与共享测试注册函数超过 80 行，但均保持单一适配/验收矩阵职责，本批不为行数拆分。

## 快照替换与验证边界

更新 `docs/governance/modules/request/SNAPSHOT.md`：替换“默认解析非 2xx”为“默认兼容、标准解析显式开启”，明确 Network.cause 必有、两个 bug 修复例外，并以 204 项测试替换 128 项旧计数。旧事实固定保留于 `docs/governance/archive/w1r0rk-standard-error/PROGRESS.md` 与 Git 57f4b05 的领域快照，本进度记录替换依据。

未验证：真实 uni 真机/条件编译平台、真实网关、跨仓下游整应用与未来发布 tarball；本批使用传输 mock、真实 Axios/ofetch 执行链及本机构建包。旧实现对照沿用当前已装传输依赖，不冒充重建完整历史 lockfile 环境。两项保留 bug 修复以外，所覆盖默认场景的旧字段一致；没有声称所有可能输入已穷尽。

## 独立复核与收口

- requesting-code-review 技能要求的独立只读代理已复核实际 diff、新测试与 fb7514b 原实现：Critical / Important 均无。确认默认旧字段、空文案、uni errMsg、cause 类型、显式路径与 beforeError 行为符合需求。
- 非阻塞提醒（保留）：base package.json 原有 test 仍是 echo，因此 `pnpm -r test --run` 不执行新 base 两项；本批按用户要求显式执行四包 Vitest，2 项已实测。未为接入脚本扩大 manifest 改动；后续运行全量时须继续单独运行 base Vitest。不是未验证测试，不影响本批验收。
- 复核曾考虑但未判问题的内容：两项已授权保留的 bug 修复、追加上下文字段、自定义解析器抛错/undefined 的 HTTP 兜底。主代理分别核对需求授权与测试，保持实现；若两项旧错误码被下游专门依赖，仍需按 README 已知差异处理，不能承诺这两个点零行为差异。
- r7op3n 的实现与文档已验收，无未完成功能回池。需求源和逐项验收保留在本进度；清除已完成正文，批次归档仅保留 PROGRESS。快照与归档将在同次提交交付；当前仅是工作区归档，尚未取得交付 sha。

## 本批文件清单

ⓐ 公共层：`packages/base/src/error.ts`、`packages/base/src/response-error.ts`、`packages/base/src/types.ts`、`packages/base/src/__tests__/error.spec.ts`。

ⓑ uni 适配：`packages/uni/src/main.ts`。

ⓒ 默认与标准回归：`tests/default-error-contract.ts`、`tests/standard-error-contract.ts`、`packages/axios/src/__tests__/default-error.spec.ts`、`packages/axios/src/__tests__/standard-error.spec.ts`、`packages/axios/src/__tests__/cause-type.ts`、`packages/ofetch/src/__tests__/default-error.spec.ts`、`packages/ofetch/src/__tests__/standard-error.spec.ts`、`packages/uni/src/__tests__/default-error.spec.ts`、`packages/uni/src/__tests__/standard-error.spec.ts`。

ⓓ 使用文档：`packages/base/README.md`、`packages/axios/README.md`、`packages/ofetch/README.md`、`packages/uni/README.md`。

ⓔ 治理：`docs/governance/modules/request/SNAPSHOT.md`、`docs/governance/ARCHIVE-DONE.md`、`docs/governance/archive/o9pt1n-standard-error-opt-in/PROGRESS.md`。入池/下发时 BACKLOG/SCHEDULE 已生成；收口后恢复原清单（无最终 diff）。

本批无下一批，交付后收工；不 push、不发版。提交预定使用 feat 类型且无 BREAKING CHANGE，保持 conventionalCommits 的 minor 方向；正文记录 uni 超时与 ofetch 响应优先两个保留修复，供发布 CHANGELOG 生成。不执行实际版本计算或发布。

## 提交前闸

- `done-coding harness lists --dir docs/governance` 后，`lists --check` 退出 0：`✅ 清单与条目一致`；`check` 退出 0：`✅ 元闸 / 并行闸 / 收口形态 / 清单 全过`；`instructions` 退出 0：`✅ 指令预算 / 链路预算 / CLAUDE.md 兼容入口 全过`。在途 0，归档目录只有本文件。
- 本批 TS / README / 快照 / PROGRESS 运行 Prettier write 后，`pnpm exec prettier --check <显式文件清单>` 退出 0：`All matched files use Prettier code style!`；机器清单沿用既有 prettierignore，由 lists 校验。
- `git diff --check` 退出 0；提交前 git status 仅本批 21 个文件（含 7 个新文件）。构建目录均显示 !! ignored；版本、manifest、pnpm-lock.yaml、CHANGELOG 无 diff。尚待正常 Git 暂存/提交与最终工作区检查。

## Git 阻塞与交付状态

- 正常 `git add -- <上述 21 个显式路径>` 退出 128：`fatal: Unable to create '<repo>/.git/index.lock': Operation not permitted`（按仓内文档规则将错误中的本机绝对仓路径替换为 `<repo>`；最终回执提供完整原文）。未尝试提权、索引迁移或重试，不执行依赖暂存成功的 git commit。
- `git diff --cached --stat` 输出为空；未提交成功，交付 sha 无，HEAD 仍为 57f4b05。上述 21 个文件全部保留在工作区；归档与快照是已验证、待提交产物，不能把归档清单当成提交成功证据。
- 第 ⓓ 项的独立审阅、快照、归档布局与机械闸已完成；仅提交及“提交后工作区干净”未完成。继续所需最小条件：允许在本仓正常写入 .git 索引和创建提交，然后使用上述显式文件清单提交；不需要安装依赖或新增网络权限。
- 拟用提交消息已保存在 `.scratch/r-optin/commit-message.txt`，类型 feat，无 BREAKING CHANGE，正文已记录两项保留 bug 修复。未修改版本、依赖、锁文件、CHANGELOG、remote；没有 push 或发版。无人值守按用户指令停止于真实权限阻塞。

## 收口（2026-10-29，沙箱外复核者）

- 实现提交 `bc29407`（复核者代提交，提交说明取自 `.scratch/r-optin/commit-message.txt`，类型 feat、无 BREAKING CHANGE）。
- 独立复跑：`npx lerna run build` 4 包成功；四包 `vitest run` 共 204 项全过（base 2、axios 71、ofetch 64、uni 67）；`pnpm -r exec tsc --noEmit` 退出 0。核对 diff：未配置时不再调用解析器（`options.getErrorFromResponse?.(...)`），文案回到适配器 `legacyMessage`，`RequestFailResultNetwork.cause` 恢复必有。
