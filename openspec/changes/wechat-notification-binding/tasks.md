# tasks for wechat-notification-binding

## Phase 1: 绑定模块

- [x] T1.1: 创建 `src/wechat/binding.ts` — 绑定状态管理（生成配对码、存储、校验、解除）
- [x] T1.2: 创建 `src/wechat/cli.ts` — `comet wechat bind/status/unbind` CLI 命令
- [x] T1.3: 注册 `comet wechat` 子命令到 `src/cli/index.ts`
- [x] T1.4: 创建 `test/ts/wechat/binding.test.ts` — 绑定模块单元测试 (7 tests)

## Phase 2: 通知模块

- [x] T2.1: 创建 `src/wechat/pending.ts` — 待处理决策存储和读取
- [x] T2.2: 创建 `src/wechat/notifier.ts` — 微信通知发送（桩实现，后续接入 wechat-acp bridge）
- [x] T2.3: 添加 `comet wechat notify/poll/reply/bind-confirm` CLI 子命令
- [x] T2.4: 创建 `test/ts/wechat/pending.test.ts` — 待处理决策模块单元测试 (6 tests)

## Phase 3: Agent 集成 + 文档

- [x] T3.1: 更新 CHANGELOG
- [x] T3.2: 更新 `PLUGIN_DEVELOPMENT_GUIDE.md` 增加绑定章节
