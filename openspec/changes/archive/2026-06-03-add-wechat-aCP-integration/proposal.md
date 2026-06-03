# change: add-wechat-aCP-integration

## 问题

用户希望在 wechat-acp bot 对话中直接使用 `comet` 命令（`/comet <command>`），而不是每次手动切换到 comet 工作目录执行。当前两个项目完全独立：

- **wechat-acp**: 独立的 Node.js 微信机器人框架，通过 iLink API 与微信交互，支持 ACP（Agent Client Protocol）
- **comet**: Go CLI 工具，在本地工作目录管理 OpenSpec change 生命周期

用户期望的体验：在微信对话中使用 `/acp` 与 AI agent 交流时，能通过特定指令触发 comet 操作，实现"从聊天界面直接管理项目变更"的能力。

## 目标

- **必做**: 将 wechat-acp 作为子模块集成到 comet 项目中
- **必做**: 设计可扩展的插件/通道架构，支持未来添加其他消息平台（如 Telegram、Slack）
- **必做**: 定义 wechat-acp 与 comet 之间的清晰接口边界
- **必做**: 在 tasks.md 中明确 wechat-acp 子模块的管理方式（独立仓库 vs monorepo 子目录）

## 范围

**包括 (In scope)**:
1. wechat-acp 作为 comely 项目的集成目标（被管理/调用的组件）
2. 可扩展插件通道架构设计
3. wechat-acp 与 comet CLI 之间的通信接口定义
4. 初步的 plugin SDK 骨架

**排除 (Out of scope)**:
1. wechat-acp 本身的功能开发、bug 修复
2. 实际的微信消息处理逻辑实现（留给后续 tasks）
3. 其他消息平台的完整实现

## 非目标

- 不直接修改 wechat-acp 的现有代码逻辑
- 不替换或竞争 wechat-acp 的定位（它仍是独立的 bot 框架）
- 不实现完整的微信端 CLI 交互界面

## 任务清单

### Phase 1: 集成设计

- [ ] T1.1: 分析 wechat-acp 架构，确认 comet 集成的切入点
- [ ] T1.2: 设计插件/通道架构（接口、SDK、消息格式约定）
- [ ] T1.3: 确定 wechat-acp 子模块管理策略（submodule / vendor / monorepo workspace）
- [ ] T1.4: 创建 change proposal + design + tasks（当前文档即为此阶段产物）

### Phase 2: 架构骨架

- [ ] T2.1: 在 comet 项目中创建 `plugins/` 目录结构
- [ ] T2.2: 定义 plugin SDK 核心接口（Go 类型）
- [ ] T2.3: 添加 wechat-acp 子模块引用（git submodule 或 go mod replace）
- [ ] T2.4: 实现最基础的 chat-platform 插件 stub

### Phase 3: 通信协议

- [ ] T3.1: 定义 comet ↔ plugin 的消息传输格式
- [ ] T3.2: 定义 ACP prompt ↔ comet CLI 命令映射规则
- [ ] T3.3: 实现 wechat-acp 通道的命令解析器 stub

### Phase 4: 验证与文档

- [ ] T4.1: 编写 plugin 开发指南
- [ ] T4.2: 在 CHANGELOG.md 中记录此集成
