---
id: t8el29
title: R-REL 发布流程对齐 monorepo 模板
modules: [request]
created: 2026-10-29
source: 用户任务 R-REL / r8el29 / blueprint 跨仓路线 request 发布阻塞记录
after: ""
---

# R-REL 发布流程对齐

> 文档定位：记录 · 本批工程配置、机械验证、操作清单与交付状态。

## 目标与授权

来源为本目录需求 r8el29、[blueprint 跨仓路线](~/Documents/code/blueprint/snapshot/cross-repo-route.md) 的 request 发布阻塞记录及本会话用户任务 R-REL（2026-10-29）。路线无 R-REL 独立条目，本任务是直接授权；基准原文为 [monorepo 碎片](~/Documents/code/done-coding/done-coding-template-hub/.done-coding/generator/assemble/fragments/monorepo/)。

验收：工作流与 .npmrc 原样；lerna/workspace 以模板为准；gitignore 只增；逐文件 diff、JSON 解析、四包集合不变；版本与依赖、源码、锁文件不变；说明手动发布前置及版本预测；治理和指令闸、格式检查通过。提交后才算交付，随后归档。不 push、不发版、不建分支、不改 remote、不安装依赖、不修改其他仓与全局配置。

共享骨架独占：lerna.json、pnpm-workspace.yaml、.npmrc、.gitignore、.github/workflows/release-publish.yml、.github/workflows/prerelease-publish.yml。治理改动仅本批与受影响清单及快照。

## 开工与入池

- master，初始 HEAD c576a37，git status --short 为空；Node v22.22.2、pnpm 10.33.2。先读根与治理规则、README 导航、路线页和模板全部六个文件；只读比较两份工作流与 admin，diff 均退出 0。
- 需求 r8el29 已写入 backlog 并生成清单，治理闸、指令闸、Prettier 均通过。显式 git add 成功，随后 git commit 失败、退出 128，未产生新 sha。git rev-parse --short HEAD 仍为 c576a37（旧基线，绝非本批交付）。
- 拒绝原文（按仓内路径规范缩写仓根）：`fatal: Unable to create '.git/index.lock': Operation not permitted`。完整原文保留在会话工具输出。没有提权、重试 Git 写入或更换索引。因无法 git mv，使用普通文件移动表达在途布局；此前暂存的池正文与清单是旧的中间状态，复核者提交前必须重新按显式 pathspec 暂存最终内容。
- 最小继续条件：恢复本仓标准 .git 写权限，由复核者正常暂存、提交；不需要联网、安装或更改 remote。所有可独立完成的配置与验证继续进行，不把受阻写为已交付。

## 配置取舍

- lerna.json、pnpm-workspace.yaml、.npmrc、两份工作流全部采用模板语义，无占位符。lerna 与 workspace 仅保留根 AGENTS.md 要求运行本仓 Prettier 后的排版差异：JSON 数组收为单行、YAML 单引号改双引号；没有配置值差异。本仓现有 packages/\*\* 足以包含四包；uni_modules 排除规则不影响当前集合。
- .gitignore 保留全部原条目与 .scratch/，新增模板缺项 lerna-debug.log、.DS_Store、.playwright-mcp/、test-results/；额外按用户明确要求加 .pnpm-store/（模板本身无此条目）。没有删除本地目录或文件；初检 .pnpm-store 内实际有 v10 子目录，不能称整个目录为空。
- 没有新依赖或第三方代码片段；复用用户指定的同组织模板与仓内既有 Lerna 7.4.2 / pnpm。工作流未改造，保留模板的 pnpm 10.33.0 与 Node 22；本机 pnpm 10.33.2 仅执行只读查询。
- 工作流/.npmrc 的逐字节要求优先于全局格式偏好；工作流运行本仓 Prettier write 后仍逐字节一致。.npmrc 无 Prettier parser，保持模板原字节；.gitignore 无对应 parser，以只增检查替代。首次 Prettier check 的 lerna/workspace 两项告警已通过本仓 Prettier write 修复。

## 用户需亲自完成

ⓐ 先由复核者取得 Git 写权限完成本批提交与归档，再 push master；本会话没有 push。确认 GitHub 默认分支为 master，并从最新 master 在 GitHub 建 release 与 prerelease 分支；无需本会话本地建分支。

ⓑ 在仓库 GitHub Actions Secrets 配置 NPM_TOKEN：供 setup-node 配置的 npm registry 认证和 npm 发包，必须具有这四个 @done-coding/request-\* 包的发布权限。引用为 release-publish.yml:132、prerelease-publish.yml:135，映射 NODE_AUTH_TOKEN；registry 在两份工作流 :74。

ⓒ 配置 RELEASE_GITHUB_TOKEN：checkout 认证（两份 :57），并映射 GH_TOKEN（release :133、prerelease :136）；checkout 凭据供后续推送分支和标签使用，须有仓库写权限并满足分支保护。工作流自身声明 contents: write（两份 :46–47），不能替代该 Secret 的有效权限。

ⓓ 正式发版：PR 合入 release，事件过滤为 :23–28 且 :42 要求 merged=true，先同步 master（:91–95），安装与构建后 Lerna 根据 conventional commits 发版（:130），推送 release 与标签（:141），快进并推送 master（:149–154），最后强制把 prerelease 同步到 master（:163）。因此 prerelease 不能保留需要长期保存的独立提交；实际能否快进/推送取决于远端并发和保护规则，模板注释不等于本次实测保证。

ⓔ 预发：PR 合入 prerelease，过滤位置同上；同步 master 后执行 `lerna publish prerelease --dist-tag alpha --preid alpha`（:133），推送 prerelease 和标签（:144），不会合回 master。alpha 发布与正式版不同，需消费方显式选用 alpha。没有通过本地运行 Lerna 验证发包，也没有配置或读取任何 Secret。

## 版本预测（仅本地历史推断）

稳定版四包均预测 1.3.0，置信度高，条件为基于当前历史、现有 tag 与配置发版、没有后续提交或远端 tag 差异。四包 package.json 均为 1.2.3，各自 @done-coding/request-<name>@1.2.3 tag 都落在 fb7514b；tag 之后 6b66960 `feat(request): 兼容标准 HTTP 错误格式` 实际修改四包源码且无 BREAKING CHANGE，Angular conventional commits 的 feat 对应 minor。72f7771 为 docs，Markdown 命中 ignoreChanges，不构成此处升级依据；本批是工程 chore，同样不改变 feat 已给出的 minor。

| 包                          | 当前  | 下一稳定版预测 | 依据提交          |
| --------------------------- | ----- | -------------- | ----------------- |
| @done-coding/request-base   | 1.2.3 | 1.3.0          | fb7514b → 6b66960 |
| @done-coding/request-axios  | 1.2.3 | 1.3.0          | fb7514b → 6b66960 |
| @done-coding/request-ofetch | 1.2.3 | 1.3.0          | fb7514b → 6b66960 |
| @done-coding/request-uni    | 1.2.3 | 1.3.0          | fb7514b → 6b66960 |

预发工作流给了显式 prerelease bump；按本地 Lerna 的显式 bump 优先分支与 semver.inc(1.2.3, prerelease, alpha) 规则，首次 alpha 预计四包均为 1.2.4-alpha.0，不能直接把稳定版 minor 预测改写成 1.3.0-alpha.0。这里只预测，不改 version，不运行 lerna version/publish。发布结果仍以真实 CI 日志为准。

## 验证证据

`diff <模板> lerna.json`，退出 1：

```text
2,5c2
<   "packages": [
<     "packages/**",
<     "!**/uni_modules/**"
<   ],
---
>   "packages": ["packages/**", "!**/uni_modules/**"],

```

`diff <模板> pnpm-workspace.yaml`，退出 1：

```text
2c2
<   - 'packages/**'
---
>   - "packages/**"
4c4
<   - '!**/uni_modules/**'
---
>   - "!**/uni_modules/**"

```

`diff <模板> .npmrc`，退出 0：

```text
（无输出，逐字节一致）
```

`diff <模板> .github/workflows/release-publish.yml`，退出 0：

```text
（无输出，逐字节一致）
```

`diff <模板> .github/workflows/prerelease-publish.yml`，退出 0：

```text
（无输出，逐字节一致）
```

`diff <模板> .gitignore`，退出 1：

```text
7a8
> .scratch/
9,10d9
<
< # OS / 截图取证产物（所有模板统一忽略）
13a13
> .pnpm-store/

```

改前 `pnpm -r ls --depth -1`，退出 0（仅把家目录规范化为 `~`）：

```text
@done-coding/request@0.0.0 ~/Documents/code/done-coding/done-coding-request (PRIVATE)

@done-coding/request-axios@1.2.3 ~/Documents/code/done-coding/done-coding-request/packages/axios

@done-coding/request-base@1.2.3 ~/Documents/code/done-coding/done-coding-request/packages/base

@done-coding/request-ofetch@1.2.3 ~/Documents/code/done-coding/done-coding-request/packages/ofetch

@done-coding/request-uni@1.2.3 ~/Documents/code/done-coding/done-coding-request/packages/uni
```

改后 `pnpm -r ls --depth -1`，退出 0（仅把家目录规范化为 `~`）：

```text
@done-coding/request@0.0.0 ~/Documents/code/done-coding/done-coding-request (PRIVATE)

@done-coding/request-axios@1.2.3 ~/Documents/code/done-coding/done-coding-request/packages/axios

@done-coding/request-base@1.2.3 ~/Documents/code/done-coding/done-coding-request/packages/base

@done-coding/request-ofetch@1.2.3 ~/Documents/code/done-coding/done-coding-request/packages/ofetch

@done-coding/request-uni@1.2.3 ~/Documents/code/done-coding/done-coding-request/packages/uni
```

前后完整原始输出在本次执行时逐字节比较相同；四包均仍为 1.2.3，根 private 包仍为 0.0.0。

### 其他实测

- `node -e 'JSON.parse(require("fs").readFileSync("lerna.json", "utf8")); console.log("lerna.json: valid JSON")'` 退出 0：`lerna.json: valid JSON`。
- 使用本机已装 yaml 2.9.0 解析两份工作流和 workspace；断言 on.pull_request 分支、closed 事件与 merged==true 条件，并把每个 run 交给 `bash -n`，退出 0：两份均 `YAML, merged PR trigger and bash -n passed`；workspace patterns 为 `["packages/**","!**/uni_modules/**"]`。这是静态验证，不执行 CI 或 shell 内容。
- Python 逐字节比对 `git ls-files packages tests package.json pnpm-lock.yaml` 与 `git show HEAD:<path>`，退出 0：`protected tracked files unchanged: 64; all original .gitignore lines preserved`。版本、依赖、源码、测试、根 package.json 和锁文件不变；gitignore 所有旧行保留。没有执行任何 install，包集合查询无需重装。
- `git check-ignore .pnpm-store/v10/probe lerna-debug.log .DS_Store .playwright-mcp/probe test-results/probe` 退出 0，输出这五条路径；没有创建探针文件或删除本地目录。
- 版本预测依据本仓已装 Lerna 7.4.2 的 `dist/index.js:8030–8057`（显式 increment 优先于 conventionalCommits）、`:1880–1937`（recommendVersion）。通过 `createRequire(require.resolve("lerna"))` 读取既有 conventional-recommended-bump 7.0.1 与 conventional-changelog-angular 7.0.0，调用只读推荐算法，不运行 Lerna 命令：

```js
const { createRequire } = require("module");
const r = createRequire(require.resolve("lerna"));
(async () => {
  const config = await r("conventional-changelog-angular")();
  for (const name of ["base", "axios", "ofetch", "uni"]) {
    await new Promise((resolve, reject) =>
      r("conventional-recommended-bump")(
        {
          path: process.cwd() + "/packages/" + name,
          lernaPackage: "@done-coding/request-" + name,
          config,
        },
        (err, data) => {
          if (err) reject(err);
          else {
            console.log(name, JSON.stringify(data));
            resolve();
          }
        },
      ),
    );
  }
  console.log(r("semver").inc("1.2.3", "prerelease", "alpha"));
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
```

输出退出 0：

```text
base {"level":1,"reason":"There are 0 BREAKING CHANGES and 1 features","releaseType":"minor"}
axios {"level":1,"reason":"There are 0 BREAKING CHANGES and 1 features","releaseType":"minor"}
ofetch {"level":1,"reason":"There are 0 BREAKING CHANGES and 1 features","releaseType":"minor"}
uni {"level":1,"reason":"There are 0 BREAKING CHANGES and 1 features","releaseType":"minor"}
1.2.4-alpha.0
```

四个发布 tag 已用 `git rev-list -n 1 @done-coding/request-<包>@1.2.3` 核对，均输出 `fb7514b8438bbf73045df202a2198d74c516480a`；各自 `git log --format="%h %s" <tag>..HEAD -- packages/<包>` 均只输出 `6b66960 feat(request): 兼容标准 HTTP 错误格式` 与 `72f7771 docs: 铺 harness 分层规则、导航与三份项目快照`。不声称远端与 npm 当前状态已验证。没有运行测试套件或构建：本批不改运行时代码或依赖，针对配置行为执行上述精确静态检查。

### 最终闸与文件状态

- Node JSON / YAML 解析后用 assert.deepStrictEqual 对照模板：`lerna/workspace template values: identical`，退出 0；前述两项 diff 只涉及排版。
- `pnpm exec prettier --write <本次可格式化文件>` 退出 0；`pnpm exec prettier --check <相同显式文件>` 退出 0：`All matched files use Prettier code style!`。显式范围为 lerna.json、pnpm-workspace.yaml、两份工作流、docs/TECH_SNAPSHOT.md、两层治理 SNAPSHOT、本批需求和 PROGRESS。.npmrc/.gitignore 不适用 parser，生成清单由 CLI 检查。
- `done-coding harness lists --dir docs/governance`：`已重生成：无变化`；`done-coding harness lists --check --dir docs/governance`：`✅ 清单与条目一致`；`done-coding harness check --dir docs/governance`：`✅ 元闸 / 并行闸 / 收口形态 / 清单 全过`；`done-coding harness instructions`：`✅ 指令预算 / 链路预算 / CLAUDE.md 兼容入口 全过`。均退出 0，指令扫描针对已有跟踪入口，并非空扫描。
- `git diff HEAD --check` 退出 0，无输出；master 不变。本批实际在途 1，schedule 批次数 1；archive 未新增。本批没有任何提交成功，禁止把 c576a37 报为交付 sha。
- 待交付文件：.gitignore、.npmrc、lerna.json、pnpm-workspace.yaml、.github/workflows/release-publish.yml、.github/workflows/prerelease-publish.yml、docs/TECH_SNAPSHOT.md、docs/governance/SCHEDULE.md、docs/governance/SNAPSHOT.md、docs/governance/modules/request/SNAPSHOT.md、本目录 PROGRESS.md 与 r8el29-release-template-alignment.md。
- 暂存区仍有首次入池的 docs/governance/BACKLOG.md 与已从工作树移走的 docs/governance/backlog/r8el29-release-template-alignment.md。BACKLOG 的最终工作树已恢复为空池；复核者须在正常 Git 权限下用显式 pathspec 一并更新这两个路径及上述最终文件，不能直接提交当前旧暂存快照。没有为整理暂存区再次尝试 Git 写入。
- 未验证 GitHub Actions 实跑、远端分支保护/Secrets/npm 权限及实际发版；任务禁止 push/publish，因此以本地模板对照、配置静态检查与历史预测交付复核材料。

## 快照替换与收口

- 治理组合快照将“没有跟踪 CI 门禁文件”替换为已有两份发布工作流及本批证据指针；模块快照补充已核实的发布配置，保留运行时契约与既有验证边界；项目技术快照只将“未跟踪 CI”改为现状指针，其余运行时旧陈述不在本批范围内修订。
- 旧 CI 事实与新事实对照固定封存在本 PROGRESS，原文另可由 c576a37 的对应快照读取；没有迁移或丢弃其他历史。
- 未完成交付与归档：没有本批提交 sha，故保留在途条目，快照反映工作区事实，尚未进入 Git 历史。恢复正常 Git 写权限后先提交实现及快照，再在 PROGRESS 回填实际 sha、移除已完成需求正文、移动批次到 archive、更新两个快照中的 schedule 指针为 archive、运行 lists 与各闸后提交收口。

## 交付

未提交；本批 sha 无。Git 写权限阻塞后不再次尝试；批次留在 schedule，保留唯一需求正文供复核者继续，不能冒充已归档。无功能范围的未完成项需另开需求，剩余为本批提交、回填 sha、清除已完成正文、归档及重生成清单。无下一批。

## 收口（2026-10-29，沙箱外复核者）

- 复核：两份工作流与 `.npmrc` 和模板 `diff` 零差异；`lerna.json`、`pnpm-workspace.yaml` 仅本仓 prettier 排版差异（引号、数组折行），值一致；`.gitignore` 只增 5 条。暂存区中间态已用 `git reset` 清空后重新按组暂存。
- 交付提交：配置 `a3a3050`（复核者代提交）。GitHub 上的 CI 实跑与真实发布未验证，待用户按上文清单完成 push、建分支、配 Secrets 后由首次发版验证。
