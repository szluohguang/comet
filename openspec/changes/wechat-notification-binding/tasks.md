# tasks for wechat-notification-binding

## Phase 1: 绑定模块

- [ ] T1.1: 创建 `src/wechat/binding.ts` — 绑定状态管理（生成配对码、存储、校验、解除）
- [ ] T1.2: 创建 `src/wechat/cli.ts` — `comet wechat bind/status/unbind` CLI 命令
- [ ] T1.3: 注册 `comet wechat` 子命令到 `src/cli/index.ts`
- [ ] T1.4: 创建 `test/ts/wechat/binding.test.ts` — 绑定模块单元测试

## Phase 2: 通知模块

- [ ] T2.1: 创建 `src/wechat/pending.ts` — 待处理决策存储和读取
- [ ] T2.2: 创建 `src/wechat/notifier.ts` — 微信通知发送（通过 wechat-acp bridge）
- [ ] T2.3: 添加 `comet wechat notify` 和 `comet wechat poll` CLI 子命令
- [ ] T2.4: 创建 `test/ts/wechat/notifier.test.ts` — 通知模块单元测试

## Phase 3: Agent 集成 + 文档

- [ ] T3.1: 更新 CHANGELOG
- [ ] T3.2: 更新 `PLUGIN_DEVELOPMENT_GUIDE.md` 增加绑定章节
