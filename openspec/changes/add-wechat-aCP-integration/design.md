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
wechat-acp monitor (long-poll)
    ↓ WeixinMessage
acp/session.go → SessionManager.enqueue()
    ↓ acp.ContentBlock
inject/monitor.ts → InjectionMonitor.onMessage()
    ↓ InjectedMessage (file system)
bridge.ts → enqueueInjectedMessage()
    ├── 场景 A: 正常对话 → agent subprocess (现有流程不变)
    └── 场景 B: comet 指令 → Go plugin adapter (新增)
            ↓
        comet CLI subprocess + stdio
            ↓
        ResponseFormatter.Format()
            ↓
        sendReply() → iLink API → 微信
```

### 6. 安全边界

- **不直接修改** wechat-acp 源码，仅通过 submodule 锁定版本消费
- Go plugin adapter 只读取 wechat-acp 发布产物（编译后的 JS/bundle）
- comet CLI 的输出通过管道限制（超时、缓冲区大小），避免 agent 注入风险
- `CommandMapper.MapToCommand()` 必须有白名单验证，非白名单的命令拒绝执行

### 7. 配置管理

```yaml
# .comet.yaml (新增 plugin 配置段)
plugins:
  wechat:
    enabled: true
    bridge_url: "https://wechat-acp.example.com/api"  # or local path to wechat-acp
    token_file: "~/.wechat-acp-token"                  # auth credentials
```

## API 边界

### comet 提供
1. CLI 可执行文件（`comet` binary）— plugin 通过 `os/exec` 调用
2. `.comet.yaml` 状态文件 — plugin 读取得知当前 change 状态
3. open spec delta specs — plugin 读取变更内容用于生成上下文

### wechat-acp 提供
1. 微信消息接收/发送能力（iLink API 包装）
2. ACP session/sessionConfig 管理能力
3. 消息格式化（分块、typing 指示器、缓冲模式）

### 新增接口（plugin adapter）
1. `comet plugin register` — 注册新通道插件
2. `comet plugin list` — 列出已启用插件
3. Plugin SDK Go module（`cloudwego.io/comet/plugins/sdk/v1`）

## 风险与缓解

| 风险 | 缓解措施 |
|---|---|
| wechat-acp 上游破坏性变更 | git submodule pinned to specific commit |
| 跨语言调试困难 (Go ↔ TypeScript) | 明确插件接口 + 日志追踪（每步 trace ID） |
| agent 通过 chat 注入恶意命令 | CommandMapper 白名单 + 输出沙箱 |
| 微信消息格式差异导致兼容问题 | 平台消息标准化中间层，适配具体平台细节 |
