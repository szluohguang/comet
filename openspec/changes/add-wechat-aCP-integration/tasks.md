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
