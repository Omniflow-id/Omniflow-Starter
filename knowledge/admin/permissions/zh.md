# 权限管理 (/admin/permissions)

**权限管理**功能允许管理员在 Omniflow 系统中创建、查看和管理单个权限。权限是 RBAC（基于角色的访问控制）系统的基本构建块。

## 快速操作

| 操作 | 方法 |
|------|------|
| 查看所有权限 | 打开 [/admin/permissions](/admin/permissions) |
| 创建新权限 | 点击 **"+ 添加权限"** 按钮 |
| 编辑权限 | 点击权限卡片 → **编辑** |
| 删除权限 | 点击权限卡片 → **删除**（如未分配给角色） |
| 分配给角色 | 打开 [/admin/roles](/admin/roles) |

## 默认权限

| 权限名称 | 描述 | 默认分配 |
|----------------|-----------|-------------------|
| `view_users` | 查看用户账户和信息 | 管理员、部门经理 |
| `manage_users` | 创建、编辑和删除用户账户 | 管理员、部门经理 |
| `manage_permissions` | 管理角色和权限系统 | 仅管理员 |
| `view_logs` | 查看系统活动日志和审计追踪 | 管理员、部门经理 |
| `manage_cache` | 管理系统缓存和性能 | 管理员 |
| `manage_queue` | 管理任务队列和后台任务 | 管理员 |
| `view_profile` | 查看和编辑自己的用户资料 | 所有角色 |

## 权限命名规范

### 标准前缀

| 前缀 | 用途 | 示例 |
|--------|---------|--------|
| `view_` | 只读访问 | `view_users`, `view_logs`, `view_reports` |
| `manage_` | 完整 CRUD 访问 | `manage_users`, `manage_cache`, `manage_queue` |
| `approve_` | 审批工作流 | `approve_requests`, `approve_transactions` |
| `export_` | 数据导出操作 | `export_users`, `export_reports` |
| `delete_` | 删除操作 | `delete_users`, `delete_records` |

### 最佳实践

✅ **好的命名：**
- `view_financial_reports`
- `manage_inventory`
- `approve_leave_requests`
- `export_employee_data`

❌ **差的命名：**
- `financial` (过于模糊)
- `all_access` (破坏 RBAC 目的)
- `admin_permission` (范围不明确)

## 创建新权限

1. 打开 **[权限管理](/admin/permissions)**
2. 点击 **"+ 添加权限"** 按钮
3. 填写表单：
   - **权限名称**：使用下划线命名（如：`view_reports`）
   - **描述**：简要说明此权限允许的操作
4. 点击 **保存**
5. **后续步骤**：在 [/admin/roles](/admin/roles) 中分配给角色

### 示例：创建部门自定义权限

**场景：** 人力资源部门需要访问员工数据

```
权限名称: view_employee_records
描述: 查看员工个人信息和记录
```

然后在 [/admin/roles](/admin/roles) 中将其分配给"人力资源经理"角色。

## 权限与角色的关系

### 核心概念

- **权限**：原子性访问权限（如 `view_users`）
- **角色**：权限的集合（如"经理"拥有 `view_users` + `manage_users`）
- **用户**：分配一个角色，继承该角色的所有权限
- **覆盖**：用户可以单独授予或撤销权限（PBAC）

### 权限流程

```
权限 → 角色 → 用户 → 授予访问权限
```

**示例：**
1. 创建权限 `manage_reports`
2. 在 [/admin/roles](/admin/roles) 中将其分配给"报表经理"角色
3. 在 [/admin/users](/admin/users) 中将用户分配给"报表经理"角色
4. 用户现在可以管理报表

## 用户权限覆盖（PBAC）

系统支持**针对个别用户的权限覆盖**，可以扩展或限制角色权限：

### 授予额外权限

为特定用户分配超出其角色的额外权限：

1. 打开 [/admin/users](/admin/users)
2. 点击用户 → **管理权限**
3. 启用其角色中没有的额外权限
4. **结果**：用户拥有角色权限 + 额外权限

**示例：**
- 经理角色拥有：`view_users`, `manage_users`, `view_logs`
- 授予特定经理 `manage_cache`
- 最终权限：`view_users`, `manage_users`, `view_logs`, `manage_cache`

### 撤销角色权限

在不更改角色的情况下移除用户的某些权限：

1. 打开 [/admin/users](/admin/users)
2. 点击用户 → **管理权限**
3. 禁用特定的角色权限
4. **结果**：用户失去该权限，即使其角色拥有该权限

**示例：**
- 经理角色拥有：`view_users`, `manage_users`, `view_logs`
- 撤销特定经理的 `manage_users`
- 最终权限：`view_users`, `view_logs`

### 覆盖公式

```
最终用户权限 = (角色权限 + 用户授予) - 用户撤销
```

### 何时使用覆盖

✅ **适用场景：**
- 临时提升访问权限
- 培训/试用期
- 范围受限的承包商
- 跨职能团队成员

❌ **不适用场景：**
- 永久性访问模式（创建新角色）
- 多个用户需要相同覆盖（修改角色）
- 安全例外（修复安全策略）

## 编辑权限

### 修改权限详情

1. 在 [/admin/permissions](/admin/permissions) 中点击权限卡片
2. 点击 **编辑**
3. 更新名称或描述
4. 点击 **保存**

⚠️ **警告：** 更改权限名称会影响所有使用该权限的角色和用户。

### 检查权限使用情况

在编辑前，查看权限的使用位置：

1. 点击权限卡片
2. 查看 **"被 X 个角色使用"** 计数
3. 点击查看角色列表
4. 导航到 [/admin/roles](/admin/roles) 进行审查

## 删除权限 ⚠️

### 删除前检查清单

删除权限前：

1. 检查使用该权限的角色在 [/admin/roles](/admin/roles)
2. 检查具有覆盖授予的用户在 [/admin/users](/admin/users)
3. 先从所有角色中移除
4. 移除所有用户覆盖
5. 再删除权限

### 删除方法

1. 打开 [/admin/permissions](/admin/permissions)
2. 点击权限卡片 → **删除**
3. 确认删除

### 安全规则

- ❌ 如果已分配给任何角色，无法删除
- ❌ 如果有用户具有覆盖授予/撤销，无法删除
- ✅ 已删除的权限将从系统中永久移除
- ⚠️ 无撤销操作 - 删除是永久性的

## 常见场景

### 场景 1：新功能需要访问控制

**问题：** 创建新的"报表"功能，需要访问控制

**解决方案：**
1. 在 [/admin/permissions](/admin/permissions) 创建权限：
   - `view_reports`（只读）
   - `manage_reports`（完全访问）
2. 打开 [/admin/roles](/admin/roles)
3. 将 `view_reports` 分配给"用户"角色
4. 将 `manage_reports` 分配给"经理"角色

### 场景 2：临时项目访问

**问题：** 开发人员需要临时访问缓存进行调试

**解决方案：**
1. 打开 [/admin/users](/admin/users)
2. 找到开发人员 → **管理权限**
3. 授予 `manage_cache` 权限
4. 调试完成后，撤销权限覆盖
5. **结果**：临时访问，无需更改角色

### 场景 3：部门重组

**问题：** 财务团队现在需要管理库存

**解决方案：**
1. 在 [/admin/permissions](/admin/permissions) 创建权限：
   - `view_inventory`
   - `manage_inventory`
2. 打开 [/admin/roles](/admin/roles)
3. 找到"财务"角色 → **管理权限**
4. 添加库存权限
5. 财务团队的所有用户立即获得访问权限

### 场景 4：受限范围的承包商

**问题：** 外部承包商需要查看用户但不能查看敏感数据

**解决方案：**
1. 在 [/admin/roles](/admin/roles) 创建"承包商"角色
2. 仅分配 `view_users` 和 `view_profile`
3. 如需例外，使用权限覆盖
4. 合同结束时，停用用户账户

## 故障排除

| 问题 | 解决方案 |
|-------|--------|
| 权限不在角色中 | 打开 [/admin/roles](/admin/roles) → 管理权限 → 添加 |
| 用户有权限但无法访问 | 检查用户账户是否在 [/admin/users](/admin/users) 处于激活状态 |
| 无法删除权限 | 先从所有角色和用户覆盖中移除 |
| 权限更改不生效 | 用户可能需要登出并重新登录 |
| 权限过多 | 考虑创建权限类别/组 |
| 覆盖不生效 | 检查 [/admin/log](/admin/log) 中的活动日志以查找错误 |

## 权限系统架构

### 缓存集成

- 权限查询在 Redis 中缓存 5 分钟
- 缓存键模式：`user:{userId}:permissions`
- 更改自动使缓存失效
- 在 [/admin/cache/stats](/admin/cache/stats) 查看缓存统计

### 活动日志

所有权限更改都会被记录：

- 权限创建/删除
- 权限分配给角色
- 用户权限覆盖（授予/撤销）
- 在 [/admin/log](/admin/log) 查看日志

### 数据库表

- `permissions` - 所有系统权限
- `role_permissions` - 角色到权限的映射
- `user_permissions` - 用户特定覆盖（授予/撤销）
- 权限启用软删除（可恢复）