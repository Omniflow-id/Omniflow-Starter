# Sub-Module 页面 ([/admin/submodule](/admin/submodule))

**Sub-Module Page** 是一个模板/占位页面，用于演示 Omniflow 管理面板中的子路由模式。

## 快速操作

| 操作 | 方法 |
|------|------|
| 查看子模块 | 访问 [/admin/submodule](/admin/submodule) |
| 返回仪表盘 | 访问 [/admin](/admin) |

## 目的

此页面的作用：
- **模板**：子模块结构示例
- **占位符**：用于未来功能开发
- **模式**：演示嵌套路由

## 路由模式

### URL 结构

```
/admin/submodule
```

### 路由层级

```
/admin (主管理区域)
└── /submodule (子模块示例)
```

## 页面结构

### 典型子模块组件

**头部：**
- 面包屑导航（仪表盘 > 子模块）
- 页面标题
- 操作按钮

**内容区域：**
- 功能特定内容
- 数据表格或表单
- 统计或图表

**底部：**
- 相关链接
- 帮助资源

## 模板开发

### 创建新子模块

添加新子模块时，请遵循以下模式：

**1. 路由定义**（`routes/admin.js`）：
```javascript
router.get("/admin/submodule", isLoggedInAndActive, checkPermission("view_submodule"), getSubmodulePage);
```

**2. 控制器**（`controllers/admin/getSubmodulePage.js`）：
```javascript
const getSubmodulePage = asyncHandler(async (req, res) => {
  // 使用缓存加载数据
  const result = await handleCache({
    key: "admin:submodule:data",
    ttl: 300,
    dbQueryFn: async () => {
      // 数据库查询
      return { data };
    },
  });

  res.render("pages/admin/submodule", {
    data: result.data,
    cacheInfo: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});
```

**3. 视图**（`views/pages/admin/submodule.njk`）：
```html
{% extends "layout/masterLayout.njk" %}

{% block title %}Sub-Module{% endblock %}

{% block content %}
<div class="container-fluid">
  <h1>Sub-Module</h1>
  <!-- 内容在此处 -->
</div>
{% endblock %}
```

**4. 知识库**（`knowledge/admin/submodule/en.md`）：
- 记录功能和使用说明
- 添加快速操作表
- 包含常见场景
- 提供故障排除指南

## 权限配置

### 所需权限

为子模块创建权限：
```
权限名称：view_submodule
描述：访问子模块功能
```

**分配给角色：**
1. 前往 [/admin/permissions](/admin/permissions)
2. 创建权限 `view_submodule`
3. 前往 [/admin/roles](/admin/roles)
4. 分配给相应角色（管理员、经理等）

## 常见用例

### 用例 1：部门专用模块

**示例：** HR 部门需要专用区域

**实现：**
- 创建子模块 `/admin/hr`
- 添加权限 `view_hr`
- 分配给"HR 经理"角色
- 构建 HR 特定功能

### 用例 2：功能专用区块

**示例：** 报表模块

**实现：**
- 创建子模块 `/admin/reports`
- 添加报表生成功能
- 集成数据导出
- 缓存报表结果

### 用例 3：管理工具

**示例：** 系统维护工具

**实现：**
- 创建子模块 `/admin/tools`
- 添加权限 `manage_tools`（仅管理员）
- 包含维护操作
- 记录所有工具使用

## 集成点

### 导航

将子模块添加到侧边栏（`views/partials/sidebarLayout.njk`）：

```html
{% if hasPermission(permissions, 'view_submodule') %}
  <li class="nav-item">
    <a class="nav-link" href="/admin/submodule">
      <i class="fas fa-cube"></i>
      <span>Sub-Module</span>
    </a>
  </li>
{% endif %}
```

### 面包屑

包含面包屑导航：

```html
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="/admin">Dashboard</a></li>
    <li class="breadcrumb-item active">Sub-Module</li>
  </ol>
</nav>
```

## 最佳实践

### 子模块设计

✅ **推荐做法：**
- 明确且具体的目的
- 使用专用权限检查
- 使用缓存加载数据
- 活动日志记录
- 移动端响应式设计
- 与管理界面保持一致

❌ **避免：**
- 混合不相关的功能
- 没有权限检查
- 直接查询数据库
- 没有错误处理
- 破坏界面一致性

### 性能

✅ **优化：**
- 使用 Redis 缓存
- 服务端 DataTables
- 延迟加载重组件
- 压缩响应
- 数据库查询索引

### 安全性

✅ **安全措施：**
- 要求身份验证
- 检查权限
- 验证所有输入
- 清理输出
- 记录敏感操作
- 使用 CSRF 保护

## 测试清单

### 子模块测试

- [ ] 使用正确权限可访问路由
- [ ] 无权限时返回 403 错误
- [ ] 页面正常加载
- [ ] 数据正确显示
- [ ] 表单提交成功
- [ ] CSRF 令牌正常工作
- [ ] 缓存失效正常
- [ ] 移动端响应式
- [ ] 错误处理正常
- [ ] 活动日志记录正常

## 文档要求

### 知识库文件

为每个子模块创建：

**英文**（`knowledge/admin/submodule/en.md`）：
- 概述和目的
- 快速操作表
- 功能文档
- 常见场景
- 故障排除指南

**中文**（`knowledge/admin/submodule/zh.md`）：
- 翻译内容
- 保留英文技术术语
- 保持 Markdown 结构

## 相关页面

| 页面 | 目的 |
|------|------|
| **仪表盘** | [/admin](/admin) - 主管理区域 |
| **权限管理** | [/admin/permissions](/admin/permissions) - 权限管理 |
| **角色管理** | [/admin/roles](/admin/roles) - 角色配置 |
| **活动日志** | [/admin/log](/admin/log) - 操作审计 |

## 子模块示例

### 现有子模块

| 路由 | 目的 |
|------|------|
| `/admin/user/*` | 用户管理操作 |
| `/admin/ai_models` | AI 模型管理 |
| `/admin/ai_use_cases` | AI 用例管理 |
| `/admin/ai_analysis_settings` | 全局 AI 配置 |
| `/admin/queue/*` | 任务队列管理 |
| `/admin/cache/*` | 缓存操作 |
| `/admin/log/*` | 查看活动日志 |

### 潜在的子模块

- `/admin/reports` - 报表和分析
- `/admin/settings` - 系统配置
- `/admin/backup` - 备份和恢复
- `/admin/audit` - 安全审计日志
- `/admin/notifications` - 通知管理

## 开发说明

此页面演示了：
- **路由模式**：嵌套管理路由
- **权限集成**：基于角色的访问
- **界面一致性**：遵循管理模板
- **文档**：知识库集成
- **可扩展性**：易于添加新模块

**模板状态：** 准备就绪，可实现
**知识库：** 完整（en.md, id.md, zh.md）
**路由示例：** `/admin/submodule`