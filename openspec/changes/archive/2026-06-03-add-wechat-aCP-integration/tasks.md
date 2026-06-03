# tasks for add-wechat-aCP-integration（实现）

## Phase 2: SDK + 骨架

- [x] T2.1: 在 `src/plugins/sdk.ts` 创建 Plugin SDK 接口定义（Plugin, PluginConfig, CommandMapper, ResponseFormatter）
- [x] T2.2: 添加 wechat-acp git submodule 到 `plugins/wechat-acp`（v0.8.0, pinned）
- [x] T2.3: 创建 `src/commands/plugin.ts`（新增 plugin subcommand: list, register, start, stop）
- [x] T2.4: 定义 `src/plugin/manager.ts` + `src/plugin/loader.ts`（核心框架）

## Phase 3: wechat 插件实现

- [x] T3.1: 在 `plugins/wechat-plugin/src/adapter.ts` 实现消息桥接适配器（comet 侧）
- [x] T3.2: 编写 `plugins/wechat-plugin/src/adapter.ts`（消息格式转换 + 命令白名单映射）
- [x] T3.3: 新增 ACP prompt → comet CLI 命令转换规则和校验白名单

## Phase 4: 集成测试 + 文档

- [x] T4.1: 单元测试 PluginManager（6 tests）+ adapter 映射（6 tests）+ loader（1 test）
- [x] T4.2: 在 `CHANGELOG.md` 中添加此集成的变更条目
- [x] T4.3: 编写 `PLUGIN_DEVELOPMENT_GUIDE.md`（如何添加新通道）
