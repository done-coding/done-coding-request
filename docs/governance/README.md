# 工作区治理

> 文档定位：规范 · 适用于本仓治理资料。已初始化：2026-10-28；采用批次目录与外部反馈入口，模块资料按需建立。

本仓领域归属唯一真源为 [MODULES.md](MODULES.md)，全项目执行流程见 [DEVELOPMENT.md](DEVELOPMENT.md)。

| 入口                                            | 职责                          |
| ----------------------------------------------- | ----------------------------- |
| [MODULES.md](MODULES.md)                        | 物理代码单元到领域的映射      |
| [SNAPSHOT.md](SNAPSHOT.md)                      | 领域组合、依赖和全局技术基线  |
| [AGENTS.md](AGENTS.md)                          | 维护治理文档时的规则          |
| [PROGRESS.md](PROGRESS.md)                      | 本次初始化的活进度与验证边界  |
| [BACKLOG.md](BACKLOG.md) / backlog/             | 需求池清单 / 唯一正文         |
| [SCHEDULE.md](SCHEDULE.md) / schedule/          | 在途批次清单 / 批次任务与进度 |
| [ARCHIVE-DONE.md](ARCHIVE-DONE.md) / archive/   | 已交付批次清单 / 仅留进度     |
| [DROPPED.md](DROPPED.md) / dropped/             | 作废或合并条目的理由与指针    |
| [ISSUE.md](ISSUE.md) / issue/                   | 外部仓未分诊的现象报告        |
| [request 领域快照](modules/request/SNAPSHOT.md) | 该领域的当前能力与技术细节    |

## 外部反馈

接收其他仓对请求 SDK 的现象及复现路径。反馈只填 id、title、created、from，modules 由本仓分诊补齐；只有用户触发才分诊，不承诺回执或实施。

## 调度边界

仓内未发现数据库迁移或部署串行写点，当前没有横向调度领域，也无常驻调度会话。本次 RQ 初始化由当前执行会话完成；未来出现串行写点时再明确当轮承接者。

## 资料落点

本次初始化只使用根 PROGRESS；未来批次必须使用 `schedule/<id>-<slug>/PROGRESS.md`，不能把本页的进度入口变成第二份任务账。
确需封存判断、审计、证据时分别建立 `judgments/`、`audits/`、`records/evidence/`，并维护对应 INDEX.md；本轮无此类产物，不预建空目录。

## 生成器边界

本机 dc-harness 0.3.0 的生成清单头部仍写旧入口 `scripts/governance-lists.py`；本仓没有该脚本，实际唯一生成命令为 `dc-harness lists --dir docs/governance`。为保持生成清单零 diff，不手改生成文本，也不为迁就旧提示添加脚本。
