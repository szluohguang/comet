# Proposal: WeChat Notification & Binding

## 问题背景

Comet 流程中多个决策点（如 verify 失败修复/接受、分支处理方式等）需要使用 AskUserQuestion 工具等待用户确认。当用户离开电脑时，流程会阻塞停滞，无法推进。

## 目标

1. 提供 `comet wechat bind` CLI 命令，支持配对码 + 链接双通道绑定微信用户
2. 到达决策点时同时发微信通知，5 分钟内无交互自动进入微信确认模式
3. 用户在微信中回复后，Agent 下次启动时自动读取回复并继续流程
4. 支持查看绑定状态和解除绑定

## 非目标

- 不修改 wechat-acp 自身的消息处理逻辑
- 不实现其他平台（Telegram/Slack）的通知
- 不涉及实时 WebSocket/SSE 推送

## 范围

- `src/wechat/cli.ts` — `comet wechat` CLI 子命令
- `src/wechat/binding.ts` — 绑定状态管理
- `src/wechat/pending.ts` — 待处理决策状态管理
- `src/wechat/notifier.ts` — 微信通知发送
- Agent skill 集成 — `comet` skill 决策点接入通知
