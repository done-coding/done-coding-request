# 治理目录维护规则

> 文档定位：规范 · 仅在维护 docs/governance/ 文件时适用。只读 DEVELOPMENT.md 不代表启动治理维护；全项目开发流程以 DEVELOPMENT.md 为准。

## 正文与清单

ⓐ [MUST] 需求正文在任一时刻只保留一份，用 `git mv` 在 backlog/、schedule/、dropped/ 间流转；取消批次或本批未完成条目回池，不留 picked 中间态。
ⓑ [MUST] 池条目 frontmatter 含 id、title、modules、created、parent；id 为随机六位小写 base36，文件名为 `<id>-<slug>.md`，领域名以 MODULES.md 为准。
ⓒ [MUST] 批次 PROGRESS frontmatter 含 id、title、modules、created、source、after；modules 汇总全部所涉领域，after 只表示同窗口批次串的直接前驱。
ⓓ [MUST] 外部反馈先入 issue/，仅填 id、title、created、from 及现象与复现；用户触发分诊后补领域并流转至池、批次或作废区。
ⓔ [MUST] 作废正文保留 dropped 与 dropped_at；合并时另记 merged_into，保留溯源。
ⓕ [MUST] 修改正文或批次后运行 `dc-harness lists --dir docs/governance` 生成五份清单，提交前运行 `dc-harness check --dir docs/governance` 与 `dc-harness instructions`；清单不手改。

## 快照与归档

ⓖ [MUST] MODULES.md 是领域归属唯一真源；组合 SNAPSHOT 每领域只保留一行摘要、依赖与技术基线，领域细节只写 modules/<领域>/SNAPSHOT.md 的技术快照、业务快照、UX 快照三节；快照覆盖当前事实，替换说明写进本批进度。
ⓗ [MUST] schedule/ 和 archive/ 根只放一级批次目录；在途目录只有 PROGRESS.md 与条目，交付前未完成条目回池、更新领域快照、清除已完成正文，再归档为仅有 PROGRESS.md 的目录，逐项记交付 sha。
ⓘ [MUST] 归档前核对快照提交不晚于归档提交、清单重生成零 diff、在途数等于真实在途批次数；只读审计按 DEVELOPMENT.md 的事实未变路径处理。
ⓙ [MUST] 新建文档头部声明定位与范围；记录、判断和审计按 README 的固定目录归位并建主题索引，项目级三快照重复内容改成指针；自定义文档名用小写短横线，固定协议名保留。
ⓚ [MUST] 本目录 CLAUDE.md 保持为普通文件，首个非空行是 `@AGENTS.md`，仅在其后追加 Claude 专属规则，不复制公共正文。
