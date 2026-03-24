# Generated Passwords ([/admin/passwords](/admin/passwords))

**Generated Passwords** 页面在批量导入用户后显示自动生成的密码，允许管理员安全地向新用户传达登录凭据。

## 快速操作

| 操作 | 方法 |
|------|------|
| 查看生成的密码 | 在 Excel 导入后访问 [/admin/passwords](/admin/passwords) |
| 复制密码 | 点击密码文本即可复制 |
| 下载密码列表 | 点击 **"Download CSV"** 按钮（如果可用） |
| 返回用户管理 | 访问 [/admin/users](/admin/users) |

## 密码生成时机

### 批量用户上传流程

生成密码出现在以下步骤后：

1. 管理员访问 [/admin/users](/admin/users)
2. 点击 **"Upload Users"** 按钮
3. 上传包含用户数据的 Excel 文件
4. 系统创建用户并生成自动密码
5. **重定向到** [/admin/passwords](/admin/passwords)
6. 显示所有生成的密码以供分发

### Excel 文件要求

**必需列（共4列）：**
- `name` - 登录用户名
- `email` - 用户邮箱地址
- `full_name` - 完整姓名（用于密码生成）
- `role` - 用户角色（Admin、Manager、User）

**注意：** 密码列不需要（系统自动生成）。

## 密码生成模式

### 公式

```
去掉空格的姓名 + "@12345?."
```

### 示例

| 完整姓名 | 生成的密码 |
|---------|-------------------|
| Eric Julianto | `EricJulianto@12345?.` |
| Jane Smith | `JaneSmith@12345?.` |
| Ahmad Wijaya | `AhmadWijaya@12345?.` |
| Maria Garcia | `MariaGarcia@12345?.` |
| John Doe | `JohnDoe@12345?.` |

### 模式组成

| 组成部分 | 用途 | 示例 |
|----------|--------|--------|
| **完整姓名** | 用户标识 | `EricJulianto` |
| **无空格** | 删除空白字符 | `Eric Julianto` → `EricJulianto` |
| **@** | 特殊字符 | `@` |
| **12345** | 数字 | `12345` |
| **?.** | 附加符号 | `?.` |

### 符合密码策略

✅ **满足所有要求：**
- **大写字母**：每个姓名的首字母（E、J）
- **小写字母**：其余字母（ric、ulianto）
- **数字**：固定模式（12345）
- **符号**：三个符号（@、?、.）
- **长度**：通常15-30个字符
- **无重复**：最多连续2个相同字符

## 安全警告

### ⚠️ 生成密码的风险

**可预测的模式：**
- 密码遵循一致的公式
- 如果知道模式则可能被猜测
- **不适合长期使用**

**安全最佳实践：**
- 用户必须在首次登录时更改密码
- 通过安全渠道（加密邮件、安全消息）传达密码
- 使用后删除/失效临时密码
- 监控未更改的生成密码

### 首次用户操作说明

**新用户邮件模板：**

```
Subject: Welcome to Omniflow - Account Credentials

Dear [Full Name],

Your account has been created:

Username: [username]
Temporary Password: [GeneratedPassword]
Login URL: [APP_URL]/admin/login

IMPORTANT SECURITY NOTICE:
1. Login with the temporary password above
2. IMMEDIATELY change your password at /admin/change-password
3. Choose a unique, strong password
4. Do not share your credentials

This temporary password is predictable and must be changed immediately.
```

## 密码显示页面

### 显示的信息

对于每个生成的用户：
- **用户名**：登录标识
- **邮箱**：用户邮箱地址
- **完整姓名**：全名
- **角色**：分配的角色
- **生成的密码**：临时密码（可见）

### 安全功能

- **一次性显示**：页面仅在导入后出现一次
- **不永久存储**：密码只显示一次，无法再次查看
- **基于会话**：导航离开后数据被清除
- **仅管理员访问**：需要 `manage_users` 权限

## 常见场景

### 场景1：批量用户入职

**用例：** HR 从 Excel 导入50名新员工

**流程：**
1. HR 准备包含4列的 Excel（name、email、full_name、role）
2. 在 [/admin/users](/admin/users) 上传
3. 系统生成50个用户及密码
4. **重定向到** [/admin/passwords](/admin/passwords)
5. HR 复制/下载密码列表
6. HR 通过邮件发送个人凭据
7. 新用户登录并更改密码

**最佳实践：**
- 通过加密邮件发送凭据
- 使用安全的密码共享服务
- 设置临时密码过期时间
- 监控首次登录完成情况

### 场景2：快速添加单个用户

**用例：** 需要立即入职一名外包人员

**流程：**
1. 创建单行 Excel：
   ```
   name,email,full_name,role
   jdoe,john.doe@example.com,John Doe,User
   ```
2. 上传文件
3. 查看生成的密码：`JohnDoe@12345?.`
4. 通过安全渠道发送凭据
5. 指示立即更改密码

### 场景3：密码列表丢失

**问题：** 管理员在保存密码前离开页面

**影响：**
- 生成的密码不再可见
- 用户无法登录
- 需要重置密码

**解决方案：**
1. 访问 [/admin/users](/admin/users)
2. 对每个用户：点击 **Edit** → **Reset Password**
3. 系统生成新密码
4. 管理员提供新凭据

**预防：**
- 立即下载密码 CSV
- 复制到安全的密码管理器
- 保存密码前不要离开页面

### 场景4：用户从未更改密码

**安全风险：** 用户仍在使用 `FullName@12345?.` 密码

**检测方法：**
1. 在 [/admin/log](/admin/log) 查看活动日志
2. 检查密码更改事件
3. 识别未更改密码的用户

**解决方案：**
1. 在下次登录时强制更改密码（如果功能可用）
2. 停用账户直到密码更改
3. 联系用户更改密码
4. 如果用户无响应则重置密码

## 最佳实践

### 管理员职责

✅ **导入时：**
- 立即查看生成的密码
- 在离开前下载/复制密码列表
- 验证所有用户是否成功创建
- 记录错误或失败的导入

✅ **分发时：**
- 仅通过安全渠道发送凭据
- 不要在纯文本邮件中发送密码
- 使用密码共享服务（如：1Password、Bitwarden）
- 包含首次登录说明
- 设置后续提醒

✅ **监控时：**
- 跟踪首次登录完成情况
- 监控未更改的密码
- 定期查看活动日志
- 跟进未登录的用户

### 用户沟通

**安全的分发方式：**

| 方式 | 安全性 | 推荐程度 |
|------|--------|----------|
| 加密邮件 | 中等 | ✓ 低风险系统 |
| 密码管理器共享 | 高 | ✓ 最佳实践 |
| 安全消息（Signal） | 高 | ✓ 敏感账户 |
| 面对面 | 最高 | ✓ 高管人员 |
| 纯文本邮件 | 非常低 | ✗ 不使用 |
| 短信 | 低 | ✗ 避免 |
| Slack/Teams DM | 低 | ✗ 避免 |

## Excel 导入要求

### 正确的格式

**文件：** `users.xlsx` 或 `users.csv`

**列顺序（精确名称）：**
```
name,email,full_name,role
```

**数据示例：**
```csv
name,email,full_name,role
jsmith,jane.smith@company.com,Jane Smith,Manager
bdoe,bob.doe@company.com,Bob Doe,User
aadmin,alice@company.com,Alice Admin,Admin
```

### 常见导入错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| Column not found | 列名错误 | 使用精确名称：name、email、full_name、role |
| Duplicate email | 邮箱已存在 | 从 Excel 中删除重复项 |
| Invalid role | 角色不存在 | 使用：Admin、Manager 或 User |
| Missing required field | 空单元格 | 为每个用户填写全部4列 |
| File format error | 文件类型错误 | 仅使用 .xlsx 或 .csv |

## 故障排除

| 问题 | 诊断 | 解决方案 |
|------|-----------|----------|
| 密码页面为空 | 导入失败 | 检查上传错误，重试导入 |
| 无法复制密码 | 浏览器限制 | 使用 Download CSV 按钮 |
| 密码无法登录 | 输入错误或大小写 | 验证精确密码（区分大小写） |
| 用户无法登录 | 账户未激活 | 在 [/admin/users](/admin/users) 激活 |
| 密码列表丢失 | 离开页面 | 单独重置密码 |
| 模式未遵循 | BUG或手动创建 | 报告给开发人员 |

## 安全检查清单

### 分发前

- [ ] 已下载/复制所有密码
- [ ] 验证用户数量与导入匹配
- [ ] 准备好安全的分发方式
- [ ] 起草了首次登录说明
- [ ] 设置了日历提醒以便跟进

### 分发后

- [ ] 确认用户收到凭据
- [ ] 监控首次登录尝试
- [ ] 验证密码更改已完成
- [ ] 删除了临时密码副本
- [ ] 在活动日志中记录流程

### 30天后续

- [ ] 检查未更改的密码
- [ ] 如需要则强制重置密码
- [ ] 停用未使用的账户
- [ ] 审计账户创建活动

## 相关页面

- **用户管理**：[/admin/users](/admin/users) - 用户 CRUD 和上传
- **更改密码**：[/admin/change-password](/admin/change-password) - 密码策略
- **活动日志**：[/admin/log](/admin/log) - 跟踪密码更改
- **角色管理**：[/admin/roles](/admin/roles) - 了解角色权限