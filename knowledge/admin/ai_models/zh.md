# AI模型管理 ([/admin/ai_models](/admin/ai_models))

**AI Models** 模块是 Omniflow 智能的核心。该模块允许管理员配置与各种 LLM（大型语言模型）提供商的连接，如 OpenAI、Anthropic 或兼容的本地模型。

## 快速操作

| 操作 | 方法 |
|------|------|
| **添加模型** | 点击 **添加新模型** → 填写详情 |
| **编辑模型** | 点击 **编辑**（铅笔图标）所在行 |
| **切换状态** | 点击 **状态** 按钮（启用/禁用） |
| **删除模型** | 点击 **删除**（垃圾桶图标） |

## 配置字段

| 字段 | 说明 | 示例 |
|--------|-----------|--------|
| **名称** | 内部参考用显示名称 | `GPT-4 Omni`、`Claude 3.5 Sonnet` |
| **模型变体** | 提供商所需的 API ID 字符串 | `gpt-4o`、`claude-3-5-sonnet-20240620` |
| **API URL** | Chat completions 完整端点 | `https://api.openai.com/v1/chat/completions` |
| **API 密钥** | 密钥（加密存储） | `sk-proj-123...` |
| **是否启用** | 控制 Use Case 中的可用性 | `是` / `否` |

## 提供商支持

Omniflow 支持任何兼容 **OpenAI Chat Completion API** 格式的提供商。

### 1. OpenAI（默认）
- **URL**：`https://api.openai.com/v1`（或完整路径 `/chat/completions`）
- **模型**：`gpt-4o`、`gpt-4-turbo`、`gpt-3.5-turbo`

### 2. DeepSeek（通过兼容模式）
- **URL**：`https://api.deepseek.com`
- **模型**：`deepseek-chat`、`deepseek-coder`

### 3. 本地模型（Ollama/vLLM）
- **URL**：`http://localhost:11434/v1`
- **模型**：`llama3`、`mistral`
- **注意**：确保 Omniflow 服务器可以访问本地网络 IP。

## 安全与加密

- **加密**：API 密钥在存入数据库前使用 AES-256 加密。
- **显示**：保存后密钥永不以明文显示。只能进行替换。
- **传输**：请求采用服务器到服务器方式；密钥不会到达客户端浏览器。

## 常见场景

### 场景一：API 密钥轮换（Key Rotation）
如果密钥泄露或过期：
1. 打开 [/admin/ai_models](/admin/ai_models)。
2. 编辑受影响的模型。
3. 将新密钥粘贴到 **API Key** 字段。
4. 保存。新密钥会立即替换旧密钥。

### 场景二：添加节省成本逻辑
1. 创建一个名为"省钱AI"的模型。
2. 使用更便宜的变体，如 `gpt-4o-mini`。
3. 设置为 **启用**。
4. 打开 **Use Cases**，将"省钱AI"分配给常规/非优先级任务。

## 故障排除

| 问题 | 检查 | 解决方案 |
|----------|-----|----------|
| **连接失败** | API URL | 确保 URL 以 `/v1` 或 `/chat/completions` 结尾（根据库而定）。 |
| **401 未授权** | API Key | 密钥可能错误或已过期。请更新。 |
| **找不到模型** | 模型变体 | 检查模型 ID 拼写（如：`gpt-4` vs `gpt-4o`）。 |
| **超时/缓慢** | 网络 | 检查防火墙或代理服务器设置。 |

> **专业提示**：使用 **"测试连接"** 功能（如果有）或创建临时的"测试"Use Case 来验证新模型后再发布给用户。
