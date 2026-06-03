# Design: WeChat Notification & Binding

## 架构决策

### 1. 绑定方式：配对码 + 链接双通道

**决策**: `comet wechat bind` 同时输出 6 位短配对码和一个绑定链接。

**流程**:
```
用户运行: comet wechat bind
  → 生成 6 位配对码 (如: WX-8A3F2K) + 绑定链接
  → 终端同时输出:
      配对码: WX-8A3F2K
      链接:   https://wechat-bind.example.com/bind?code=WX-8A3F2K
  → 用户在微信 ACP 中输入配对码或打开链接
  → wechat-acp 收到绑定请求 → bridge 回传 comet
  → 存储绑定关系
```

### 2. 通知流程：延时转入微信确认

**决策**: 通知不替代 AskUserQuestion，而是作为超时后的后备通道。

```
Agent 到达决策点
  ├→ 保存待处理决策到 src/wechat/pending.json
  ├→ 发微信通知（含选项文字）
  └→ 调用 AskUserQuestion

     ├→ 用户在 5 分钟内回复 AskUserQuestion → 删除待处理状态
     │
     └→ 5 分钟超时 → 用户可在微信中回复
           └→ 回复写入 pending.json
           └→ 下次 Agent 调用 /comet 时：
                 reads "wechat poll" → 有待处理回复 → 读取并按回复继续
```

### 3. 模块划分

```
src/wechat/
├── binding.ts     # 绑定关系管理（生成配对码、存储、校验、解除）
├── pending.ts     # 待处理决策管理（存储、检查、读取、清除）
├── notifier.ts    # 微信通知发送（通过 wechat-acp bridge）
└── cli.ts         # CLI 命令定义（bind/status/unbind/notify/poll）
```

### 4. 数据存储

```typescript
// binding.json (用户配置目录)
interface BindingState {
  userId: string;        // wechat-acp user id
  nickname: string;      // 微信昵称
  pairingCode: string;   // 配对码
  codeExpiresAt: string;  // 过期时间
  boundAt: string;       // 绑定时间
}

// pending.json (项目目录)
interface PendingDecision {
  changeName: string;
  question: string;
  options: { label: string; value: string }[];
  notifiedAt: string;
  wechatReplied: boolean;
  replyValue: string | null;
  repliedAt: string | null;
}
```

### 5. 安全边界

- 配对码 10 分钟过期
- 绑定关系存储在项目本地（不依赖远程服务）
- wechat-acp 桥接信令仅包含绑定确认，不传递敏感数据
