---
id: w1r0rk
title: W1-R 标准错误格式兼容
modules: [request]
created: 2026-10-28
source: 用户任务 W1-R / 0rk5y6 / blueprint 0018ⓒ
after: ""
---

# W1-R 标准错误格式兼容

> 文档定位：记录 · 本批实现、验证及交付进度；只修改本仓，不 push、不发版、不改版本号。

## 目标与依据

- 唯一需求正文：本目录 `0rk5y6-standard-error-compatibility.md`，文末修订优先。
- 原文：`~/Documents/code/blueprint/decisions/0018-resource-spec-v0-trial.md` ⓒ，以及 `~/Documents/code/blueprint/reviews/2026-10-28-resource-spec-v0-trial.md` 错误格式、状态映射、ⓔ request 验收与文末修订。
- 已读跨仓路线，未找到 W1-R 独立条目；本次用户任务直接授权实施，取代需求正文原先的只入池边界。
- 完成标准：三个适配器透传标准错误与 beforeError 字段；legacy 恒 200 保持成功/失败语义；验收矩阵、类型、lint、文档格式、治理闸通过；更新快照并归档，显式 pathspec 提交。

## 进度

- 已核验 master 工作区初始干净，Node v22.22.2、pnpm 10.33.2；治理闸与指令闸通过。
- 已复用现有 base 错误类与业务分发抽象；测试沿用 Vitest / MSW，不引入依赖，不另造协议解析框架。
- 下发尝试 `git mv` 被沙箱拒绝：`fatal: Unable to create '.git/index.lock': Operation not permitted`（错误中的本机绝对路径省略）。没有尝试提权或绕过；普通文件移动保留批次工作布局，Git rename 尚未暂存。提交仍受阻。
- 已写入尚未验证的实现：base 新增响应错误类型、默认解析器与公共 HTTP 错误入口；三个适配器接入真实 status / body；错误类保留可选上下文，成功 HTTP 下业务分发补 httpStatus。未完成测试与 README，不将代码存在当成验收通过。
- `kind` 当前实现约定为：非成功 HTTP 为 `http`，成功 HTTP 下业务失败为 `business`，无响应/传输失败为 `network`；解析到业务码时 isBusinessError 为 true，HTTP 兜底为 false。需待完整回归确认。
- 未刷新领域快照、未归档：尚未验证的实现不能替换当前能力事实。

## 验证与阻塞

- 下发前、下发后 `done-coding harness check --dir docs/governance` 均退出 0；`done-coding harness instructions` 退出 0。清单用已装 `done-coding harness lists --dir docs/governance` 生成。
- `pnpm exec prettier --write <本次代码文件>` 退出 254：`Command "prettier" not found`；未格式化成功，Markdown 格式检查亦未完成。
- `pnpm exec eslint --fix <本次代码文件>` 退出 2：宿主回退到 ESLint 6.8.0，`ESLint couldn't find the config "alloy" to extend from`；lint 未通过。
- `pnpm install --offline --frozen-lockfile` 退出 1：`ERR_PNPM_OUTDATED_LOCKFILE`，现有适配器 lockfile 为 `workspace:^`，manifest 为 `workspace:1.2.3`。
- `pnpm install --offline --no-frozen-lockfile --ignore-scripts` 退出 1：`ERR_PNPM_NO_OFFLINE_TARBALL`，缓存缺少 `eslint-8.51.0.tgz`。
- `pnpm install --no-frozen-lockfile --ignore-scripts --fetch-retries=0 --fetch-timeout=15000` 退出 1：`EPERM ... connect EPERM 127.0.0.1:7890 - Local (0.0.0.0:0)`，依赖下载被环境阻止。
- 安装未改变 `pnpm-lock.yaml`，未手改或删除重建锁文件；未改 manifest / 版本。`git diff --check` 退出 0，分支仍为 master。
- 根据用户网络阻塞停止条件停止；类型检查、构建和测试未运行，不宣称通过。尚待补验收矩阵与 README、完成格式/lint/类型/测试、更新快照、归档与提交。
- 继续所需最小条件：可访问现有 registry/proxy 或完整离线 pnpm 缓存（含开发依赖），以及允许正常 Git 索引写入。恢复后先重读规则与本文件，核对实际 diff 后继续。

## 交付

- 未提交，交付 sha 暂无；本批无下一批，交付后收工。

## 续作（2026-10-28）

- 已重新读取根与治理规则、需求正文含修订、blueprint 0018 与试验稿及跨仓路线；保留此前实现，从未验证阶段继续。复核者已安装依赖，本轮没有重装或下载依赖，未修改锁文件、版本或其他仓。
- 已补三个适配器共用的标准错误验收矩阵（`tests/standard-error-contract.ts`）：201 / Location、九种错误状态、字段四类定位、HTML / 非 JSON / 缺码包体、legacy、默认/定制解析与 beforeError 普通对象回传；另补无响应、超时、离线的传输边界测试和默认解析器边界测试。
- 为保留试验稿要求的响应元信息，成功结果增加可选 `_response={status,statusText,headers}`，不改变 `_raw` 的既有形状；错误响应原始信息留在 cause。
- 初轮检查发现并修复验收基础问题：ofetch 1.3.4 在导入时捕获 fetch，测试改用现有 createFetch 注入动态 fetch；旧 ofetch 测试 getter 原先误按 AxiosResponse 读取，按该包真实入参修正；MSW 未匹配请求全部模拟断连，Axios 测试关闭环境代理，避免依赖外网。
- 新增 uni 超时分类测试暴露未预处理源码中后续平台分支覆盖已识别的超时码，已最小修复。已有旧用例只断言超时文案，新增用例同时验证 code / kind / cause。
- Axios 新增 21 项首次通过；ofetch 新增 21 项首次通过。完整类型、lint、构建、扩充后的回归正在核验，尚不声明最终通过。
- 实现复用本仓既有错误类、业务 getter、请求核心及已装 Vitest/MSW/ofetch createFetch；属于现有协议适配，不新增通用框架、依赖或外部代码片段，免造轮子核查。共享工程改动仅新增测试矩阵 `tests/standard-error-contract.ts`。

## 最终验证与快照替换

- `pnpm -r test --run` 退出 0，原文摘要：Axios `Tests 48 passed (48)`；ofetch `Tests 40 passed (40)`；uni `Tests 40 passed (40)`，共 128 项，无跳过。base 的 test 脚本仍为说明，base 默认解析器另由 Axios 套件的 8 项用例通过公开入口实测，未把说明脚本当作独立测试通过。
- 验收对应：三个适配器各自的 25 项共用矩阵覆盖 201/Location、400/401/403/404/409/422/429/500/503、非 JSON/HTML/缺码包体、无响应/超时/离线、恒 200 成功/失败、四类字段定位、定制解析、解析异常兜底、beforeError 普通对象保留；原有三包各 15 项回归全部通过，uni 原先跳过的离线用例已恢复且通过。
- `pnpm -r exec tsc --noEmit` 退出 0，无诊断输出；改动代码 `pnpm exec eslint --fix <显式文件清单>` 退出 0，再以不带 --fix 的 ESLint 核验退出 0；文件清单见交付记录。
- README 均已增加新增配置与错误字段说明，并修正 ofetch 基础示例中 getter 的入参形状。所有改动文件运行项目 Prettier，最终格式检查结果见收口记录。
- 更新 `docs/governance/modules/request/SNAPSHOT.md`，替换旧事实“非 2xx 尚未读取标准业务错误对象、仅 code/message、base 无独立验证且未运行测试”；旧事实与替换依据保留在本节及 Git 历史，快照只列已验证的当前能力。
- 内聚性复核：三个既有 createRequest / uni 错误回调及共用测试注册函数超过 80 行，分别对应单一传输适配或同一验收矩阵，未引入第二类生产职责；本次不为行数拆分既有逻辑，所有生产文件小于 600 行。
- 未验证：真实 uni 设备、真实网关及其他仓宿主联调；本仓验收使用 MSW、注入 fetch/axios adapter 和 uni 原生回调 mock，未连接真实后端。本轮没有引入依赖、改变版本、重装依赖、push 或发版。

## 收口记录

- `pnpm -r build` 退出 0，四包均输出 `✓ built` / `Done`，声明文件生成成功。随后顺序执行 `pnpm -r exec tsc --noEmit` 退出 0、无诊断输出；此前曾与构建清理并行造成声明文件暂时缺失，已用顺序执行消除此验证干扰。
- 生成清单直接执行 Prettier 会报固定表格格式不符，且格式化后会破坏 lists 零 diff；新增项目 `.prettierignore`，只忽略 BACKLOG/SCHEDULE/ARCHIVE-DONE/DROPPED/ISSUE 五份机器生成清单，保留 dc-harness 唯一所有权。手写文档与代码仍按 Prettier 检查；本次共享配置独占为此文件，无依赖或脚本配置变化。
- 需求 0rk5y6 已实施并通过本仓验收，无未完成需求回池；清除已完成正文、归档批次，仅保留本 PROGRESS。需求原文仍可通过 Git 历史 b4b6720 的 `docs/governance/backlog/0rk5y6-standard-error-compatibility.md` 和前述 blueprint 原文查阅。
- 当前归档为工作区产物；交付 sha、治理与格式最终检查将在本节登记，不把未提交状态写成已提交交付。
- 最终 `pnpm exec prettier --check <本次 TypeScript 与 Markdown 文件>` 退出 0，原文 `All matched files use Prettier code style!`；生成清单由 `.prettierignore` 排除，再单独用 lists --check 核验。
- `done-coding harness lists --dir docs/governance` 生成清单后，`done-coding harness lists --check --dir docs/governance` 退出 0：`✅ 清单与条目一致`；`done-coding harness check --dir docs/governance` 退出 0：`✅ 元闸 / 并行闸 / 收口形态 / 清单 全过`；`done-coding harness instructions` 退出 0：`✅ 指令预算 / 链路预算 / CLAUDE.md 兼容入口 全过`。在途为 0，本批归档目录仅有 PROGRESS.md；SCHEDULE.md 已恢复到原来的零在途内容，无最终 diff。
- `git diff --check` 退出 0；master；manifest、pnpm-lock.yaml 与版本号没有本批 diff。本轮首次正常 `git add -- <显式文件>` 成功；后续更新暂存曾报 `fatal: Unable to create '<repo>/.git/index.lock': Operation not permitted`。该命令与随后已经执行的显式 pathspec 提交处在同一轮工具调用中；提交正常成功，无提权、改索引位置或其他绕过操作。此前 `git mv` 的失败按历史保留。实现、快照与归档同在 6b66960，满足快照提交不晚于归档。

## 交付文件清单

ⓐ 公共层：`packages/base/README.md`、`packages/base/src/error.ts`、`packages/base/src/index.ts`、`packages/base/src/types.ts`、`packages/base/src/utils.ts`、`packages/base/src/response-error.ts`。

ⓑ Axios：`packages/axios/README.md`、`packages/axios/src/main.ts`、`packages/axios/src/__tests__/request.ts`、`packages/axios/src/__tests__/server.ts`、`packages/axios/src/__tests__/response-parser.spec.ts`、`packages/axios/src/__tests__/standard-error.spec.ts`。

ⓒ ofetch：`packages/ofetch/README.md`、`packages/ofetch/src/main.ts`、`packages/ofetch/src/__tests__/request.ts`、`packages/ofetch/src/__tests__/server.ts`、`packages/ofetch/src/__tests__/index.spec.ts`、`packages/ofetch/src/__tests__/standard-error.spec.ts`。

ⓓ uni：`packages/uni/README.md`、`packages/uni/src/main.ts`、`packages/uni/src/__tests__/server.ts`、`packages/uni/src/__tests__/index.spec.ts`、`packages/uni/src/__tests__/standard-error.spec.ts`。

ⓔ 共用验收与治理：`tests/standard-error-contract.ts`、`.prettierignore`、`docs/governance/BACKLOG.md`、`docs/governance/ARCHIVE-DONE.md`、`docs/governance/modules/request/SNAPSHOT.md`、本 PROGRESS；删除已完成正文 `docs/governance/backlog/0rk5y6-standard-error-compatibility.md`（其内容已按前述原文和修订验收，未另造副本）。

## 交付回执

- 需求 0rk5y6：实现、128 项测试、类型、lint、构建、文档和治理验收均已完成。交付 sha：`6b66960`（30 个文件，包含上述完整清单）；该提交的 lint-staged 对 20 个代码文件执行 `eslint --fix` 与 `prettier --write` 均成功，commitlint 通过。当前回执补录仅修改本 PROGRESS，不改变已验收实现。
- 本批无下一批；交付后收工，不 push、不发版。

- 本轮实现提交后的 `git status --short` 输出为空；本回执提交后再次检查工作区与治理清单。没有遗留功能需求或环境阻塞，未验证范围仍限上文所列真实设备/网关/跨仓联调。
