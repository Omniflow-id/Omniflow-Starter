# Omniflow 系统仪表板与功能

欢迎使用 **Omniflow 高级 ERP**。本仪表板是管理整个系统的控制中心。

## 快速导航

| 菜单 | 路由 | 描述 |
|------|-------|-----------|
| [仪表板](/admin) | `/admin` | 主仪表板页面 |
| [用户管理](/admin/users) | `/admin/users` | 管理应用程序用户 |
| [角色管理](/admin/roles) | `/admin/roles` | 管理角色与权限 |
| [权限管理](/admin/permissions) | `/admin/permissions` | 访问权限配置 |
| [AI 管理](#ai-management) | `/admin/ai_models` | AI 功能管理 |
| [缓存管理](/admin/cache) | `/admin/cache` | Redis 缓存监控 |
| [队列管理](/admin/queue) | `/admin/queue` | 后台任务监控 |
| [日志查看](/admin/logs) | `/admin/logs` | 查看系统活动日志 |
| [个人资料](/admin/profile) | `/admin/profile` | 管理您的个人资料 |

## AI 管理（新功能！）

系统集成 **4 个 AI 功能**：

### 1. AI 模型 ([/admin/ai_models](/admin/ai_models))
配置 AI 模型（OpenAI、API 密钥、模型版本）。

### 2. AI 使用场景 ([/admin/ai_use_cases](/admin/ai_use_cases))
设置 AI 聊天机器人的使用场景和知识库。

### 3. AI 分析设置 ([/admin/ai_analysis_settings](/admin/ai_analysis_settings))
AI 助手和 AI 副驾驶的全局配置：
- 默认模型
- 最大 tokens 和温度参数
- 启用上下文功能

### 4. AI 聊天 ([/admin/chat](/admin/chat))
基于 Web 的对话式 AI 界面，带有聊天记录。

### AI 助手（侧边栏 🤖）
右下角的**蓝色**按钮 - 上下文感知的快速帮助。

### AI 副驾驶（悬浮按钮 ✨）
右下角的**紫色**按钮 - 实时屏幕分析。

## 主要功能（管理员）

### 1. **用户管理 ([/admin/users](/admin/users))**
管理应用程序用户数据。

**功能：**
- **查看用户**：显示用户列表，包含邮箱、角色、状态和最后登录时间
- **添加用户**：注册新用户，自动生成密码
- **编辑用户**：更新资料、重置密码、切换激活状态
- **导入用户**：通过 Excel 模板批量导入

**常用操作：**
- 重置用户密码 → 进入 [用户管理](/admin/users) → 编辑 → 重置密码
- 停用用户 → 进入 [用户管理](/admin/users) → 切换激活状态
- 创建新管理员 → 进入 [用户管理](/admin/users) → 添加用户 → 选择"管理员"角色

### 2. **权限系统**
基于角色访问控制（RBAC）的权限管理系统。

#### **角色管理 ([/admin/roles](/admin/roles))**
管理用户访问级别：
- **管理员**：完全系统访问权限（不可删除）
- **经理**：用户管理 + 监控访问权限
- **普通用户**：仅基本资料访问权限

**操作：**
- [添加新角色](/admin/roles) → 点击"添加角色"
- [编辑角色权限](/admin/roles) → 点击角色名称 → 管理权限

#### **权限管理 ([/admin/permissions](/admin/permissions))**
精细化权限控制：
- `view_users` - 查看用户账户
- `manage_users` - 创建、编辑、删除用户
- `manage_permissions` - 配置角色和权限
- `view_logs` - 访问活动日志
- `manage_cache` - 清除缓存操作
- `manage_queue` - 管理任务队列
- `view_profile` - 查看个人资料

### 3. **系统监控**

#### **缓存管理 ([/admin/cache](/admin/cache))**
Redis 缓存管理：
- 查看缓存统计（命中、未命中、内存）
- 测试缓存性能
- 按需清除缓存
- 监控连接健康状态

**用途：** 大数据变更后，清除缓存以确保用户看到最新数据。

#### **队列管理 ([/admin/queue](/admin/queue))**
RabbitMQ 任务队列监控：
- 查看待处理、处理中、已完成、失败的任务
- 重试失败任务
- 查看队列统计数据
- 检查熔断器状态

**用途：** 监控批量邮件发送或后台导入的进度。

#### **日志查看 ([/admin/logs](/admin/logs))**
系统活动追踪：
- 按操作类型、用户、日期范围筛选
- 导出日志用于审计
- 查看活动详情元数据
- 追踪用户操作以确保安全

**用途：** 安全事件调查或用户操作审计。

### 4. **设置与个人资料**

#### **个人资料 ([/admin/profile](/admin/profile))**
- 更新个人信息（姓名、邮箱）
- 更改密码
- 配置两步验证设置

#### **两步验证安全**
- 基于邮箱的 OTP 验证
- 管理员账户必需（可配置）
- 提供备用码

## 默认角色与权限

| 角色 | 核心权限 |
|------|------------------|
| **管理员** | 所有权限 |
| **经理** | view_users, manage_users, view_logs, view_profile |
| **普通用户** | 仅 view_profile |

## 使用技巧

1. **快速搜索**：使用表格中的搜索栏快速查找用户/日志
2. **键盘快捷键**：按 `Ctrl+K` 进行快速导航（如已启用）
3. **错误排查**：如果功能异常 → 先查看 [日志](/admin/logs)
4. **缓存问题**：数据更新后 → 在 [/admin/cache](/admin/cache) 清除缓存
5. **批量操作**：在 [用户管理](/admin/users) 使用 Excel 导入进行批量创建

## 常见问题

**Q: 如何创建新管理员？**
A: 进入 [用户管理](/admin/users) → 添加用户 → 选择"管理员"角色

**Q: 用户无法访问某些功能？**
A: 检查其在 [/admin/roles](/admin/roles) 中的角色权限

**Q: 如何查看谁删除了记录？**
A: 在 [/admin/logs](/admin/logs) 中使用"删除"筛选条件查看活动日志
