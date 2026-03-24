# 队列管理 ([/admin/queue](/admin/queue))

**队列管理系统**提供对RabbitMQ任务队列和Omniflow系统后台任务处理的监控和控制功能。

## 快捷操作

| 操作 | 方法 |
|------|------|
| 查看队列统计 | 访问 [/admin/queue](/admin/queue) |
| 发送测试任务 | 点击 **"Send Test Job"** 按钮 |
| 查看所有任务 | 访问 [/admin/queue/jobs](/admin/queue/jobs) |
| 查看失败任务 | 访问 [/admin/queue/failed](/admin/queue/failed) |
| 重试失败任务 | 访问 [/admin/queue/failed](/admin/queue/failed) → **Retry** 按钮 |

## 队列统计仪表板

### 任务状态概览

| 状态 | 描述 | 标记颜色 |
|------|------|----------|
| **Pending** | 等待处理的任务 | 黄色 |
| **Processing** | 正在处理的任务 | 蓝色 |
| **Completed** | 成功完成的任务 | 绿色 |
| **Failed** | 错误任务 | 红色 |

### RabbitMQ连接状态

- **🟢 Connected**: RabbitMQ运行正常，任务处理中
- **🔴 Disconnected**: 回退到数据库仅存模式
- **⚙️ 断路器状态**:
  - **CLOSED**: 正常运行，所有任务被处理
  - **OPEN**: 保护模式激活，任务仅保存到数据库
  - **HALF_OPEN**: 测试恢复，任务处理受限

## 断路器系统

断路器保护系统免受RabbitMQ故障的影响：

### 状态

**CLOSED（正常）**
- 所有任务发送到RabbitMQ
- Worker处理任务
- 队列功能完全正常

**OPEN（保护中）**
- 任务仅保存到数据库
- 不尝试连接RabbitMQ
- 防止级联故障
- **持续时间**: 1分钟后重试

**HALF_OPEN（测试中）**
- 有限的任務处理
- 测试RabbitMQ是否已恢复
- 成功则自动关闭
- 失败则重新打开

### 触发条件

断路器在以下情况后打开：
- 连续5次RabbitMQ失败
- 连接超时错误
- 认证失败

### 恢复步骤

1. 等待冷却期（1分钟）
2. 断路器进入HALF_OPEN
3. 发送测试任务
4. **成功**: 断路器关闭，继续正常操作
5. **失败**: 断路器再次打开，等待下一个循环

## 测试任务功能

发送测试任务以验证队列功能：

### 发送测试任务的方法

1. 访问 [/admin/queue](/admin/queue)
2. 点击 **"Send Test Job"** 按钮
3. 任务发送到 `test_queue`
4. **成功**: 任务出现在 [/admin/queue/jobs](/admin/queue/jobs)
5. **Worker日志**: 查看控制台中的 "Processing job from test_queue"

### 测试任务的功能

- 验证RabbitMQ连接
- 测试worker处理能力
- 验证任务生命周期
- 检查断路器恢复

**测试任务数据:**
```json
{
  "type": "test_job",
  "message": "Hello from admin panel",
  "timestamp": "2025-01-04T10:30:00.000Z",
  "triggeredBy": "admin@omniflow.id"
}
```

## 任务管理

### 查看所有任务

访问 [/admin/queue/jobs](/admin/queue/jobs) 进行全面的任务管理：

- **状态筛选**: 全部、待处理、处理中、已完成、失败
- **任务详情**: ID、队列、状态、重试次数、时间戳
- **JSON数据查看器**: 点击展开任务数据
- **分页**: 浏览大量任务列表
- **重试失败任务**: 直接从任务列表重试

### 任务数据结构

每个任务包含：
- **ID**: 唯一任务标识符
- **Queue**: 目标队列名称（`test_queue`、`email_queue`等）
- **Data**: 包含任务指令的JSON负载
- **Status**: 任务当前状态
- **Attempts**: 重试次数与最大重试次数
- **Timestamps**: 创建、开始、完成时间
- **Error**: 失败详情（用于失败任务）

## 导航

### 队列管理路由

| 路由 | 用途 |
|------|------|
| `/admin/queue` | 主统计仪表板 |
| `/admin/queue/jobs` | 所有任务管理界面 |
| `/admin/queue/failed` | 失败任务及重试功能 |

### 相关页面

- **活动日志**: [/admin/log](/admin/log) - 查看队列操作日志
- **缓存统计**: [/admin/cache/stats](/admin/cache/stats) - 队列统计缓存于此 |

## 常见场景

### 场景1: 测试队列功能

**验证方法:**
1. 访问 [/admin/queue](/admin/queue)
2. 检查连接状态（应为🟢 Connected）
3. 点击 **"Send Test Job"**
4. 访问 [/admin/queue/jobs](/admin/queue/jobs)
5. 验证任务显示"Completed"状态

### 场景2: RabbitMQ连接丢失

**症状:**
- 连接状态显示🔴 Disconnected
- 断路器状态: OPEN
- 新任务pending（未处理）

**恢复步骤:**
1. 检查RabbitMQ服务状态
2. 如需要重启RabbitMQ
3. 等待断路器进入HALF_OPEN（1分钟）
4. 发送测试任务验证恢复
5. 断路器应自动关闭

### 场景3: 任务卡在Processing

**诊断:**
1. 访问 [/admin/queue/jobs](/admin/queue/jobs)
2. 按"Processing"状态筛选
3. 检查时间戳 - 如超过10分钟，可能卡住
4. 查看worker日志中的错误

**解决方案:**
- 重启worker进程
- 检查worker健康状态
- 检查任务数据是否损坏
- 如持续存在: 重启RabbitMQ

### 场景4: 失败任务数量过多

**诊断:**
1. 访问 [/admin/queue/failed](/admin/queue/failed)
2. 审查错误信息
3. 查找模式:
   - 网络错误 → 外部服务问题
   - 验证错误 → 任务数据问题
   - 超时错误 → Worker过载

**解决方案:**
- 修复根本问题（代码、配置、外部服务）
- 批量重试失败任务
- 如不可恢复: 记录后删除失败任务

## 故障排除

| 问题 | 检查项 | 解决方案 |
|------|--------|----------|
| 任务未处理 | 连接状态 | 确认RabbitMQ服务运行 |
| 断路器打开 | 最后错误信息 | 修复RabbitMQ连接，等待恢复 |
| Pending数量高 | Worker状态 | 确认workers运行中 |
| 任务反复失败 | 失败任务错误 | 审查任务数据和worker逻辑 |
| 测试任务未完成 | Worker日志 | 检查worker进程是否活跃 |
| 无统计数据显示 | Redis缓存 | 确认Redis连接正常 |

## 队列系统架构

### Workers

**活跃Workers:**
- `EmailWorker`: 处理邮件队列任务
- `TestWorker`: 处理测试队列任务（开发用）

**Worker位置:** `workers/` 目录

**Worker管理:** `WorkerManager` 管理所有workers

### 数据库集成

**jobs表**存储所有任务：
- 持久化存储以保证可靠性
- 任务跟踪和监控
- 失败任务分析
- 重试管理

### 死信队列（DLQ）

**用途:** 存储失败3次以上的任务

**配置:**
- **TTL**: 24小时（任务自动过期）
- **手动恢复**: 管理员可查看和重试
- **访问**: [/admin/queue/failed](/admin/queue/failed)

**任务何时进入DLQ:**
- 3次尝试均失败后
- 错误不可恢复
- 任务数据无效

## 性能监控

### 关键指标

- **Pending任务**: 应保持较低（< 100）
- **Processing任务**: 表示worker活动
- **Completed任务**: 成功任务总数
- **Failed任务**: 应小于总数的5%

### 缓存集成

队列统计缓存2分钟：
- **缓存键**: `admin:queue:stats`
- **失效**: 任务操作后自动失效
- **查看缓存**: [/admin/cache/stats](/admin/cache/stats)

### 活动日志

所有队列操作都会被记录：
- 任务创建
- 任务完成
- 任务失败
- 重试操作
- 断路器状态变更

**查看日志:** [/admin/log](/admin/log)

## 最佳实践

### 监控

✅ **定期检查:**
- 每日监控pending数量
- 每周审查失败任务
- 每月测试队列
- 检查断路器状态

### 任务重试策略

✅ **推荐做法:**
- 修复根本原因后重试失败任务
- 批量重试前审查错误模式
- 保持DLQ TTL为24小时

❌ **避免:**
- 不经分析就重试所有失败任务
- 忽略失败模式
- 无限积累DLQ

### 生产部署

✅ **检查清单:**
- 确认RabbitMQ连接正常
- 确保workers运行中
- 检查断路器状态为CLOSED
- 发送测试任务验证
- 第一个小时密切监控
