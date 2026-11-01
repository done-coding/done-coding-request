---
id: o5mvzb
title: Lerna 9 与 npm OIDC 发布认证迁移
modules: [request]
created: 2026-11-02
source: 用户本会话明确要求仅升级 Lerna 与 npm 2FA / OIDC 配置
after: ""
---

# npm OIDC 发布迁移进度

> 文档定位：记录 · 仅覆盖本批最小配置改造、npm 信任配置与验证，不扩展 CI 功能。

## 目标与边界

在 chore/npm-oidc-publishing 分支（基线 3556820）实施。功能配置仅改根 package.json、pnpm-lock.yaml、现有 release-publish.yml 和 prerelease-publish.yml；Lerna 固定 9.0.7，runner 安装 npm 11.21.1，增加 id-token: write，去掉 NODE_AUTH_TOKEN 的 NPM_TOKEN 注入。

实际发包仅获授权 alpha；正式包必须取得用户明确授权，不触发 release 发布。push 每次另行授权。

保留 Node 22、pnpm 10.33.0、[skip ci]、两个 MR closed + merged 入口、现有测试、版本策略、并发和 Git 回推逻辑、RELEASE_GITHUB_TOKEN。无新增 action、workflow、业务脚本、测试脚本或 job。Lerna 沿用 MIT 许可；不新增项目直接依赖。

四个 request 包各配置两个可信发布者：GitHub owner done-coding、repo done-coding-request，文件名 release-publish.yml / prerelease-publish.yml，Environment 留空，允许直接发布。先查再补，不删除既有信任或 Secret，不更改包级 2FA 策略。

共享骨架独占：package.json、pnpm-lock.yaml、.github/workflows/release-publish.yml、.github/workflows/prerelease-publish.yml。治理只记录本批及更新受影响技术快照和生成清单。

## 完成标准

ⓐ 四个功能文件仅含上述范围变更，成员包版本 / 源码 / 测试 / lerna.json 不变。
ⓑ 固定 pnpm 生成锁文件，核对除 Lerna 外的 workspace 直接依赖未变；安装与四包构建检查通过，沿用既有测试命令，不新增测试。
ⓒ 两个 YAML 的权限 / token 注入精确变化和 Bash 语法检查通过；MR、并发、版本命令和回推保持。
ⓓ 八条信任配置精确匹配并记录管理 API 返回 ID；未使用正常 2FA 完成前不声称写入成功。
ⓔ 本地提交、治理 / 指令 / 格式检查通过；push 逐次单独授权，未实跑的 MR 发布明确保留未验证边界。

## 执行进度

- 已核对分支干净、基线 3556820、Node 22.22.2；原安装 Lerna 7.4.2，pnpm 锁定执行器 10.33.0，沿用既有 store。
- 临时 npm CLI whoami 返回 justsosu，不改全局 npm 配置。
- 已修改 package.json、pnpm-lock.yaml 与两个发布工作流；固定 pnpm 10.33.0 完成依赖更新，离线 frozen-lockfile 安装退出 0。
- 安装后 Lerna 为 9.0.7，lerna ls 正确识别四个 1.3.0 成员包；只读命令第一次在沙箱内被 Nx 缓存权限拦截，授权执行后退出 0。
- pnpm -r build 四包构建退出 0；pnpm -r test --run 退出 0，Axios 71、ofetch 64、uni 67，共 202 项；base 脚本只 echo，未计为独立单测。
- 使用现有 js-yaml 核对 YAML，逐段 Bash -n 通过。移除本次三个认证差异后，工作流对象与基线完全相同；锁文件 importers 除根 Lerna 项外深比较相同；源码、成员包版本及 lerna.json 未改。
- npm trust list 要求正常浏览器 2FA，已在日常 Chrome 唤起；等待用户完成，不使用恢复码。尚未取得八条信任的回读结果。

- Lerna run build 最终在临时 PATH 固定 pnpm 10.33.0 后退出 0，四包构建通过。本机全局新版 pnpm 的自动依赖检查曾触发重装，已停止该次检查，并以 pnpm 10.33.0 + frozen-lockfile + offline 恢复；未更改全局或项目 pnpm 配置。该环境排障不要求修改现有 CI。
- 最终恢复后的现有测试再次退出 0：Axios 71、ofetch 64、uni 67。Prettier、治理清单、治理 check、instructions 检查通过。
- 首次 npm 管理接口双配置 POST 返回 E400，尚未产生信任记录；改为与官方 CLI 一致的每次单条配置请求，继续核验，不把尝试记作成功。
- 本次 npm 管理操作复用已安装 npm 11.21.1 的官方 @npmcli/config、npm-profile、npm-registry-fetch 模块及 npm trust 相同接口；短期权限仅存内存，先读后补并回读，不写凭据进仓。管理接口请求返回 E400 / EOTP 后停止使用该临时 API 工具，改用官方 trust CLI；没有把失败尝试视为配置成功。CLI 源码为既有 npm 依赖，未引入项目依赖或复制进仓。
- 官方依据：[npm Trusted publishing](https://docs.npmjs.com/trusted-publishers/) 与 [Lerna OIDC](https://lerna.js.org/docs/recipes/oidc-trusted-publishing)。实际账号与信任结果以管理接口回读为准。

## 快照替换记录

本批替换旧快照中发布配置仅为模板对齐、没有本批安装/测试/构建的说明；旧事实及操作边界固定保留在 git 基线 3556820 的对应快照和 archive/t8el29-release-template-alignment/PROGRESS.md。新的当前事实注明仅位于本地分支，未推送或实跑 request 的 OIDC MR 发布；历史运行时验证不重新宣称。

## 验证与交付

- 实施提交：218c1c0（chore(release): migrate npm publishing to OIDC），位于 chore/npm-oidc-publishing；提交钩子退出 0。未 push。
- request-base 的 prerelease-publish.yml 已由官方 npm trust github CLI 添加，返回 ID 67700897-8566-4aef-a3ed-f4432b647447，repo done-coding/done-coding-request，权限含 createPackage；完整八条回读仍进行中。
- 当前阻塞：官方 trust CLI 批次在 request-base 的 release-publish.yml 写入前等待正常 2FA；Chrome 实际前台标题为 npm | Security Key。已提示用户完成安全密钥/通行密钥验证；未用恢复码，未把浏览器等待视为成功。CLI 后续仍按先查后补和回读执行。
- 批次尚未收口；npm 管理认证与远端发布验证不能由本地构建替代。当前未发布任何新版本；后续仅允许 alpha，正式包需明确授权。
