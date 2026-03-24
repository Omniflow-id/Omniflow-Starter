# 缓存统计 ([/admin/cache/stats](/admin/cache/stats))

**缓存统计**页面提供全面的Redis缓存仪表板，用于通过缓存操作监控和管理系统性能。

## 快速操作

| 操作 | 方式 |
|------|------|
| 查看缓存统计 | 访问 [/admin/cache/stats](/admin/cache/stats) |
| 测试缓存性能 | 点击 **"Test Cache Performance"** 按钮 |
| 检查健康状态 | 点击 **"Check Health"** 按钮 |
| 刷新所有缓存 | 点击 **"Flush All Cache"** 按钮（⚠️ 需要确认） |
| 按模式失效缓存 | 输入模式 → 点击 **"Invalidate Cache"** |

## 仪表板概述

### 连接状态

- **🟢 Connected**: Redis正常运行，缓存功能活跃
- **🟡 Disconnected**: 回退到数据库查询
- **Connection Info**: 主机、端口、数据库编号
- **Uptime**: Redis运行时间

### 缓存统计

| 指标 | 描述 | 理想值 |
|------|------|--------|
| **Total Keys** | 缓存项数量 | 根据使用情况变化 |
| **Memory Used** | Redis内存消耗 | < 最大值的80% |
| **Hit Rate** | 缓存成功率 | > 80% |
| **Hits** | 成功的缓存读取 | 越高越好 |
| **Misses** | 缓存未命中（查询数据库） | 相对于hits越低越好 |

## 缓存操作

### Test Cache Performance

测量缓存读写速度：

1. 点击 **"Test Cache Performance"** 按钮
2. 查看结果：
   - **Write Time**: 将数据存入缓存的时间
   - **Read Time**: 从缓存读取数据的时间
   - **Total Time**: 组合操作时间
3. **性能良好**: 每次操作 < 10ms
4. **性能缓慢**: > 50ms（需检查Redis状态）

### Check Health

验证Redis连接和响应能力：

1. 点击 **"Check Health"** 按钮
2. 响应显示：
   - ✅ **Healthy**: Redis响应PING
   - ❌ **Unhealthy**: 连接问题

### Flush All Cache ⚠️

**警告**：这会删除整个系统的所有缓存数据。

**使用场景**：
- 数据库结构变更后
- 大规模配置更新后
- 调试缓存问题时
- 部署前（可选）

**刷新步骤**：
1. 点击 **"Flush All Cache"** 按钮
2. 在弹窗中确认操作
3. 所有缓存键立即被删除
4. **结果**：后续请求会变慢（重建缓存）

### Invalidate Cache by Pattern

有选择性地删除匹配模式的缓存条目：

**常用模式**：

| 模式 | 删除内容 | 使用场景 |
|------|----------|----------|
| `admin:users:*` | 所有管理员用户相关缓存 | 用户CRUD操作后 |
| `user:123:*` | 特定用户的缓存 | 用户资料更新后 |
| `datatable:*` | 所有DataTable缓存 | 批量数据变更后 |
| `admin:logs:*` | 活动日志缓存 | 日志清理后 |
| `admin:queue:*` | 队列统计缓存 | 队列操作后 |
| `admin:permissions:*` | 权限/角色缓存 | RBAC变更后 |

**失效步骤**：
1. 在文本框中输入模式（例如：`admin:users:*`）
2. 点击 **"Invalidate Cache"** 按钮
3. **结果**：仅删除匹配 的键

**通配符规则**：
- `*` 匹配任意字符
- `user:*` 删除 `user:123`、`user:456:profile` 等
- `admin:*:list` 删除 `admin:users:list`、`admin:logs:list` 等

## 缓存键模式

### 理解缓存键

所有缓存键遵循结构化模式：

```
{scope}:{resource}:{identifier}:{sub-resource}
```

### 常用键模式

**管理员面板**：
- `admin:users:list` - 用户列表页面
- `admin:users:metadata` - 用户数量和筛选条件
- `admin:logs:filters` - 日志筛选选项
- `admin:permissions:roles` - 角色及权限
- `admin:queue:stats` - 队列统计
- `admin:ai:*` - AI配置和元数据
- `ai_analysis_settings:*` - 全局AI设置

**DataTables**：
- `datatable:users:{base64_query}` - 用户DataTable结果
- `datatable:logs:{base64_query}` - 日志DataTable结果
- `datatable:jobs:{base64_query}` - 任务DataTable结果

**用户特定**：
- `user:{userId}:permissions` - 用户权限缓存
- `user:{userId}:profile` - 用户资料数据
- `user:{userId}:settings` - 用户偏好设置

### 缓存TTL（生存时间）

| 缓存类型 | TTL | 原因 |
|----------|-----|------|
| 用户权限 | 5分钟 | 安全敏感 |
| 活动日志 | 2分钟 | 频繁更新 |
| 用户列表 | 5分钟 | 变化适中 |
| 队列统计 | 2分钟 | 实时监控 |
| 角色权限 | 5分钟 | 很少变化 |
| DataTable查询 | 2分钟 | 用户特定搜索 |

## 统计解读

### 高命中率（> 80%）

✅ **良好迹象**：
- 缓存有效
- 数据库负载减少
- 响应时间快
- 系统性能良好

### 低命中率（< 50%）

⚠️ **警告迹象**：
- 缓存TTL太短
- 数据变化频繁
- 用户查询独特
- 缓存被频繁刷新

**解决方案**：
- 为稳定数据增加TTL
- 检查缓存失效逻辑
- 添加更多缓存模式
- 考虑Redis内存限制

### 高内存使用（> 80%）

⚠️ **需要操作**：
- 检查缓存键数量
- 识别大型缓存对象
- 考虑缩短TTL
- 清理未使用的缓存模式
- 增加Redis内存分配

## 常用缓存模式

### Cache-Aside模式（当前实现）

1. **先检查**缓存是否有数据
2. **如果未命中**：查询数据库
3. **存入缓存**供下次请求使用
4. **如果命中**：返回缓存数据

**优点**：
- 延迟加载（按需缓存）
- 容错（Redis故障时仍可运行）
- 自动缓存预热

### 缓存失效策略

应用使用**智能失效**：

```javascript
// 用户创建后
await invalidateCache("admin:users:*", true);
await invalidateCache("datatable:users:*", true);

// 权限变更后
await invalidateCache(`user:${userId}:permissions`, false);
await invalidateCache("admin:permissions:*", true);
```

## 常见场景

### 场景1：页面加载缓慢

**问题**：管理员页面加载时间过长

**诊断**：
1. 访问 [/admin/cache/stats](/admin/cache/stats)
2. 检查 **Hit Rate** - 如果 < 50%，缓存效果不佳
3. 点击 **"Test Cache Performance"** - 检查响应时间
4. 检查 **Total Keys** - 如果非常低，说明缓存未被使用

**解决方案**：
- 如果Redis断开：检查Redis服务
- 如果高未命中率：增加缓存TTL
- 如果性能缓慢：检查Redis内存/CPU

### 场景2：显示旧数据

**问题**：更新的数据没有立即显示

**原因**：更新后缓存未被失效

**解决方案**：
1. **立即**：失效特定模式：
   - 用户：`admin:users:*`
   - 日志：`admin:logs:*`
   - 权限：`user:*:permissions`
2. **极端方案**：刷新所有缓存（⚠️ 影响性能）
3. **修复代码**：确保控制器在更新后调用 `invalidateCache()`

### 场景3：内存溢出

**问题**：Redis内存耗尽

**诊断**：
1. 检查 **Memory Used** 指标
2. 检查 **Total Keys** 数量
3. 查找异常缓存增长

**解决方案**：
1. **立即**：刷新旧缓存模式
2. **短期**：缩短缓存TTL
3. **长期**：
   - 增加Redis内存限制
   - 实现缓存键过期策略
   - 检查缓存内容（避免大对象）

## 故障排除

| 问题 | 诊断 | 解决方案 |
|------|------|----------|
| 缓存不工作 | Redis断开 | 检查Redis服务，必要时重启 |
| 缓存性能慢 | 内存使用高 | 刷新缓存，检查Redis资源 |
| 数据过期 | 缓存未被失效 | 使用失效模式或刷新 |
| 键过多 | 无过期策略 | 检查缓存TTL，实施清理 |
| 命中率低 | 缓存策略错误 | 检查应用缓存策略 |
| 内存高 | 缓存对象大 | 减少缓存数据大小，增加内存 |

## 缓存监控最佳实践

### 定期检查

- 每日监控命中率
- 每周检查内存使用
- 每月测试性能
- 部署后刷新缓存（可选）

### 性能基准

- **写操作**: < 5ms
- **读操作**: < 2ms
- **命中率**: > 80%
- **内存使用**: < 70%

### 何时刷新

✅ **适合时机**：
- 数据库迁移后
- RBAC结构变更后
- 部署时（可选）
- 调试缓存问题时

❌ **避免刷新**：
- 高峰时段
- 作为常规维护任务
- 不了解问题原因时
- 当特定失效已正常工作