# RQ 初始化进度

> 文档定位：记录 · 仅覆盖本次初始化；当前活页覆盖维护，不作为未来批次任务账。

## 目标与授权

依次铺规则与三快照、工作区治理、将 0018ⓒ 链接入池；显式 pathspec 三笔提交。不 push、不发版，不改代码、其他仓或全局配置。

## 已执行与核验依据

已读跨仓路由与 0018 原文；路由尚无 RQ 条目，本次以用户任务单为直接授权。
仓库在 master，初始工作区干净，基线 fb7514b。
四个物理单元依据 git ls-files、package.json、src/main.ts 映射到 request 平台领域；没有业务代码残留或规划占位作为推断依据。
根规则由既有模板实例化；四包 generic-ts 无专项规则净增量，不建包级指令空壳。README 只追加 repo-map。
首次创建三快照，无旧事实或历史需要移出；项目全貌与治理领域细节通过指针分工。
治理和兼容入口已写入；空生命周期目录用 .gitkeep 保留。

## 提交阻塞

首次显式 git add 退出码 128，原文：

```text
fatal: Unable to create '.git/index.lock': Operation not permitted
```

实际错误带仓根绝对路径，此处按仓内文档约束缩写为相对路径。没有提权、重试或绕过；规则快照、治理、入池三笔提交均未完成。待恢复本仓标准 Git 写权限后按三个显式文件组分别提交，不需要改 remote。

## 验证结果

| 成功标准     | 实测命令或方法                                                                                | 结果与限制                                                                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 三快照       | Python 逐文件计二级章节并检查占位符                                                           | BUSINESS / TECH / UX 为 7 / 12 / 9，链接可解析，无模板占位符                                                                                                                |
| 导航与事实   | Python 对照 git show HEAD:<README>；读取 git ls-files、四包源码与历史 93b602c / 9049367       | 五份 README 原正文文本保留；边界处统一末尾空白；四包归 request，无路径重叠                                                                                                  |
| 清单生成     | dc-harness lists --dir docs/governance                                                        | 五份清单均由 CLI 生成，未手写                                                                                                                                               |
| 清单一致     | dc-harness lists --check --dir docs/governance                                                | `✅ 清单与条目一致`，退出码 0                                                                                                                                               |
| 治理闸       | dc-harness check --dir docs/governance                                                        | `✅ 元闸 / 并行闸 / 收口形态 / 清单 全过`，退出码 0                                                                                                                         |
| 指令闸       | dc-harness instructions --json；dc-harness instructions                                       | 命令退出码 0，但 files=[]；因新增文件无法跟踪，属于空扫描，不算有效验收                                                                                                     |
| 人工预算补验 | Python UTF-8 字节、祖先链和普通文件导入检查                                                   | 根 6085 B，治理 2392 B，最长链 8477 B，均低于 16384 / 8192 / 32768 B；两份 CLAUDE 首行均为唯一 @AGENTS.md                                                                   |
| 读取预算     | Python 全文长度累加                                                                           | 根自动注入 6085 B；强制 DEVELOPMENT 2917 B；维护治理另加 2392 B；request 定位样本按需 MODULES + 领域快照 3957 B，去重合计 15351 B；不含未来批次与代码，不将字节换算成 token |
| 格式         | 本机缓存 Prettier 3.9.9，使用根配置，仅处理新增文档与 README 导航段；git diff --check         | 无需安装依赖；生成清单采用 CLI 原样，不再次格式化；最终复跑输出 `All matched files use Prettier code style!`，退出码 0；git diff --check 无输出，退出码 0                   |
| 代码不变     | Python 将 52 个包内非 README 跟踪文件逐字节对照 git show HEAD:<path>，另核根五份工程/依赖配置 | 全部一致；未运行代码测试与构建，因为没有代码变更且未安装依赖                                                                                                                |
| 只入池       | 枚举 backlog/、schedule/、archive/                                                            | 池 1，在途 0，归档 0；标准错误适配没有实现                                                                                                                                  |

## 加载验证限制

Claude Code 2.1.283 的 `claude auth status` 返回 loggedIn=false，未运行加载会话。
Codex 0.165.0 已登录；从仓根尝试 `codex exec --ephemeral --sandbox read-only`，问题为包管理器版本锁定缺口与快照替换说明的落点，允许按规则读取文档，不在提示写答案。退出码 1：

```text
Error: failed to initialize in-process app-server client: Operation not permitted (os error 1)
```

根加载即受阻，没有继续重复同条件的子目录会话；治理按需读取、Claude/Codex 根与子目录加载、自动压缩/恢复/跨工具接手均未验证。静态文件和兼容入口检查不能替代这些实测。

## 提交文件组（均无 sha）

ⓐ 规则与快照：AGENTS.md、CLAUDE.md、.gitignore、README.md、packages/base/README.md、packages/axios/README.md、packages/ofetch/README.md、packages/uni/README.md、docs/BUSINESS_SNAPSHOT.md、docs/TECH_SNAPSHOT.md、docs/UX_SNAPSHOT.md。根开发流程短入口依赖下一组的 DEVELOPMENT.md。
ⓑ 治理：docs/governance/ 下除 backlog/ 池正文与 BACKLOG.md 外的文件；先对空池运行 lists 得到这一组的 BACKLOG.md，再独立暂存提交。当前根 PROGRESS 记录本次受阻初始化，不假造已交付归档或 sha。
ⓒ 入池：docs/governance/backlog/0rk5y6-standard-error-compatibility.md 与其重生成的 BACKLOG.md。

恢复 Git 写权限后，需要保留当前池正文，按上述组区分空池清单与含一条需求清单，以显式 pathspec 分别暂存并复跑 instructions / check 后提交；不 push、不发布。当前没有任何提交成功，不把基线 fb7514b 当交付 sha。

## 偏离与最小继续条件

用户要求的三笔提交和有效 instructions 扫描尚未完成，最小条件是允许正常写本仓 .git/index.lock 与提交元数据；没有尝试提权或绕过。
本机 CLI 0.3.0 的清单头部仍指向不存在的旧脚本，已在治理 README 说明实际命令，保留生成原样；未越界修改 CLI 或全局配置。
加载实测还需允许 Codex 初始化只读会话、Claude 有效登录；没有把未登录或受阻写成通过。
