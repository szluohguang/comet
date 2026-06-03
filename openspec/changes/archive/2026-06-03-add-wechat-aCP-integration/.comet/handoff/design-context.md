# Comet Design Handoff

- Change: add-wechat-aCP-integration
- Phase: design
- Mode: compact
- Context hash: bc377a6ef576c3278d5dc8ee1da55e8604546a1d42a6e6e013ddfd487635c1ab

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/add-wechat-aCP-integration/proposal.md

- Source: openspec/changes/add-wechat-aCP-integration/proposal.md
- Lines: 1-63
- SHA256: d3dbed1cb1634ca808522157df70bcd19b5de8b071e351cdf3814a8ee5c61f75

```md
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
```

## openspec/changes/add-wechat-aCP-integration/design.md

- Source: openspec/changes/add-wechat-aCP-integration/design.md
- Lines: 1-140
- SHA256: d05a3c1e20cf191e7d70699eedaff0938cfa1a9ecda6538bed9d0c533bb92436

[TRUNCATED]

```md
# 设计文档：wechat-acp 集成到 comely

## 架构决策

### 1. wechat-acp 的管理方式

**决策**: 使用 `git submodule` 将 wechat-acp 作为子模块引入，而非 vendor 目录或 monorepo workspace。

**理由**:
- wechat-acp 是独立的 npm 包（有独立的 `package.json`、依赖和版本）
- 用户可能同时在 other 项目中使用 wechat-acp，需要保持独立性
- submodule 允许 comet 锁定特定 commit hash，避免上游破坏性变更影响集成
- comet 本身是 Go 项目（`cloudwego.io/breeze/...` 依赖），不能与 TypeScript 共享 workspace

### 2. 插件通道架构

**决策**: 在 comely 中定义 `Plugin` 接口，wechat-acp 作为第一个 plugin 实现。

```
comet/
├── plugins/                    # Go 插件目录
│   ├── sdk.go                  # Plugin SDK - 核心接口
│   └── wechat/                 # wechat-acp 通道插件
│       ├── plugin.go           # 插件入口（启动、配置解析）
│       ├── adapter.go          # comet CLI ↔ wechat-acp 适配层
│       └── wechat-acp@0.8.2/  # git submodule checkout
│           ├── package.json
│           └── src/
├── cmd/comet/                  # CLI 入口
│   └── run.go                  # 现有 run 逻辑（不变）
```

### 3. 通信协议设计

**消息流**:

```
微信用户 → wechat-acp (Node.js) → plugin adapter (Go) → comet CLI → agent response → ...
```

核心接口定义：

```go
// plugins/sdk.go

// Plugin 是通道插件的统一接口
type Plugin interface {
    Name() string                    // 插件名称，如 "wechat"
    Start(ctx context.Context, cfg Config) error  // 启动插件
    Stop() error                     // 停止插件
}

// CommandMapper 将平台消息映射到 comet CLI 命令
type CommandMapper interface {
    MapToCommand(platformMsg string) (string, []string)  // 返回 command + args
}

// ResponseFormatter 将 comet 输出格式化为平台消息
type ResponseFormatter interface {
    Format(output string, err error) ([]string, error)  // 可能分块返回
}
```

### 4. ACP prompt ↔ Comet 命令映射规则

**决策**: 在 wechat-acp 通道中，ACP prompt 包含特殊指令前缀时触发 comet 操作。

| 微信消息 (prompt content) | 映射的 comet CLI |
|---|---|
| `/comet status` | `comet status` |
| `/comet open:feature-x` | `comet open feature-x` |
| `/comet design` | `comet design` |
| `/comet build` | `comet build` (当前 change) |
| 普通对话（无前缀） | 交给 AI agent 自由处理 |

**非标准格式**: 不使用 `/comet` 前缀的消息正常进入 ACP agent 流程，由 agent 决定是否调用 comet（通过工具调用机制）。

### 5. 数据流

```
```

Full source: openspec/changes/add-wechat-aCP-integration/design.md

## openspec/changes/add-wechat-aCP-integration/tasks.md

- Source: openspec/changes/add-wechat-aCP-integration/tasks.md
- Lines: 1-20
- SHA256: ed954c8ec1d554ca8d547aca5c0c2fa6a3975256db11e04aeb57b19c00f8c7ad

```md
# tasks for add-wechat-aCP-integration（实现）

## Phase 2: SDK + 骨架

- [ ] T2.1: 在 `plugins/` 创建 Go module + `sdk.go` Plugin 接口定义
- [ ] T2.2: 添加 wechat-acp git submodule 到 `./wechat-acp@v0.8.x`
- [ ] T2.3: 编写 `cmd/comet plugin.go`（新增 plugin subcommand）
- [ ] T2.4: Go module 中定义 `plugins/sdk.go`

## Phase 3: wechat 插件实现

- [ ] T3.1: 在 `./wechat-acp@v0.8.x` 添加适配器代码（Go ↔ TS 调用桥接）
- [ ] T3.2: 编写 `plugins/wechat/adapter.go`（消息格式转换 + 命令映射表）
- [ ] T3.3: 新增 ACP prompt → comet CLI 命令转换规则和校验白名单

## Phase 4: 集成测试 + 文档

- [ ] T4.1: 单元测试 SDK interface（mock plugin）+ adapter 映射（Go table test）
- [ ] T4.2: 在 `CHANGELOG.md` 中添加此集成的变更条目
- [ ] T4.3: 编写 `PLUGIN_DEVELOPMENT_GUIDE.md`（如何添加新通道）
```

