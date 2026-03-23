/**
 * AI Analysis Service
 * Service layer for AI analysis functionality including context generation,
 * model configuration, and analysis settings management
 */

const { db } = require("@db/db");
const config = require("@config/ai-analysis-config");

const LANGUAGE_PROFILES = {
  id: {
    locale: "id-ID",
    unknownPage: "Halaman tidak diketahui",
    systemPage: "Halaman Sistem",
    systemPromptIntro:
      "Anda adalah {role} {domain} yang ahli dalam analisis data sistem.",
    responseLanguage:
      "Gunakan bahasa Indonesia yang natural, jelas, dan profesional.",
    analysisTaskTitle: "TUGAS ANALISIS",
    userProfileTitle: "PROFIL PENGGUNA",
    systemContextTitle: "KONTEKS SISTEM",
    timeContextTitle: "KONTEKS WAKTU",
    responseFormatTitle: "FORMAT RESPONS",
    workConstraintsTitle: "BATASAN KERJA",
    communicationTitle: "GAYA KOMUNIKASI",
  },
  en: {
    locale: "en-US",
    unknownPage: "Unknown page",
    systemPage: "System page",
    systemPromptIntro:
      "You are {role} {domain} and specialize in system data analysis.",
    responseLanguage:
      "Respond in natural, clear, and professional English.",
    analysisTaskTitle: "ANALYSIS TASK",
    userProfileTitle: "USER PROFILE",
    systemContextTitle: "SYSTEM CONTEXT",
    timeContextTitle: "TIME CONTEXT",
    responseFormatTitle: "RESPONSE FORMAT",
    workConstraintsTitle: "WORK CONSTRAINTS",
    communicationTitle: "COMMUNICATION STYLE",
  },
  zh: {
    locale: "zh-CN",
    unknownPage: "未知页面",
    systemPage: "系统页面",
    systemPromptIntro: "你是擅长系统数据分析的 {role} {domain}。",
    responseLanguage: "请用自然、清晰、专业的中文回答。",
    analysisTaskTitle: "分析任务",
    userProfileTitle: "用户资料",
    systemContextTitle: "系统上下文",
    timeContextTitle: "时间上下文",
    responseFormatTitle: "响应格式",
    workConstraintsTitle: "工作限制",
    communicationTitle: "沟通风格",
  },
};

function normalizeLang(lang) {
  const base = String(lang || "")
    .toLowerCase()
    .split(/[-_]/)[0];
  return LANGUAGE_PROFILES[base] ? base : "id";
}

function getLanguageProfile(lang) {
  return LANGUAGE_PROFILES[normalizeLang(lang)] || LANGUAGE_PROFILES.id;
}

function getLocalizedPageContexts(lang) {
  const baseLang = normalizeLang(lang);
  return {
    "/admin/overview":
      baseLang === "en"
        ? "Dashboard Admin - System activity and statistics overview"
        : baseLang === "zh"
          ? "管理仪表盘 - 系统活动和统计概览"
          : "Dashboard Admin - Ringkasan aktivitas dan statistik sistem",
    "/admin/users":
      baseLang === "en"
        ? "User Management - User data and administration"
        : baseLang === "zh"
          ? "用户管理 - 用户数据和管理"
          : "Manajemen Pengguna - Data dan administrasi user",
    "/admin/permissions":
      baseLang === "en"
        ? "Permission Management - Roles and permissions"
        : baseLang === "zh"
          ? "权限管理 - 角色与权限"
          : "Manajemen Hak Akses - Roles dan permissions",
    "/admin/roles":
      baseLang === "en"
        ? "Role Management - System roles list"
        : baseLang === "zh"
          ? "角色管理 - 系统角色列表"
          : "Manajemen Roles - Daftar roles sistem",
    "/admin/log":
      baseLang === "en"
        ? "Activity Logs - System activity log"
        : baseLang === "zh"
          ? "活动日志 - 系统活动记录"
          : "Activity Logs - Log aktivitas sistem",
    "/admin/cache":
      baseLang === "en"
        ? "Cache Management - Caching system management"
        : baseLang === "zh"
          ? "缓存管理 - 缓存系统管理"
          : "Cache Management - Manajemen sistem caching",
    "/admin/queue":
      baseLang === "en"
        ? "Queue Management - Job queue management"
        : baseLang === "zh"
          ? "队列管理 - 任务队列管理"
          : "Queue Management - Manajemen job queue",
    "/admin/ai_models":
      baseLang === "en"
        ? "AI Models Management - AI model configuration"
        : baseLang === "zh"
          ? "AI模型管理 - AI模型配置"
          : "Manajemen AI Models - Konfigurasi model AI",
    "/admin/ai_use_cases":
      baseLang === "en"
        ? "AI Use Cases Management - AI use case management"
        : baseLang === "zh"
          ? "AI用例管理 - AI用例配置"
          : "Manajemen AI Use Cases - Use case AI",
    "/admin/ai_analysis_settings":
      baseLang === "en"
        ? "AI Analysis Settings - Global AI configuration"
        : baseLang === "zh"
          ? "AI分析设置 - 全局AI配置"
          : "Pengaturan AI Analysis - Konfigurasi global AI",
    "/admin/chat":
      baseLang === "en"
        ? "AI Chat - Conversation with AI Assistant"
        : baseLang === "zh"
          ? "AI对话 - 与AI助手对话"
          : "AI Chat - Percakapan dengan AI Assistant",
    "/":
      baseLang === "en"
        ? "Main Dashboard - system home page"
        : baseLang === "zh"
          ? "主仪表盘 - 系统主页"
          : "Dashboard Utama - Halaman utama sistem",
  };
}

class AIAnalysisService {
  constructor() {
    this.db = db;
    this.config = config;
  }

  /**
   * Get user context from database
   */
  async getUserContext(userId) {
    try {
      const [userData] = await this.db.query(this.config.userContext.query, [
        userId,
      ]);
      return userData[0] || {};
    } catch (error) {
      console.error("[AIAnalysisService] Error getting user context:", error);
      return {};
    }
  }

  /**
   * Get company/organization context
   */
  async getCompanyContext() {
    if (!this.config.companyContext.enabled) {
      return {};
    }

    try {
      const [companyData] = await this.db.query(
        this.config.companyContext.query
      );
      return companyData[0] || {};
    } catch (error) {
      console.error(
        "[AIAnalysisService] Error getting company context:",
        error
      );
      return {};
    }
  }

  /**
   * Get user activity context
   */
  async getActivityContext(userId) {
    if (!this.config.activityContext.enabled) {
      return {};
    }

    try {
      const [activityData] = await this.db.query(
        this.config.activityContext.query,
        [userId]
      );
      return activityData[0] || {};
    } catch (error) {
      console.error(
        "[AIAnalysisService] Error getting activity context:",
        error
      );
      return {};
    }
  }

  /**
   * Determine page context from URL
   */
  getPageContext(url, lang = this.config.ai.language) {
    const profile = getLanguageProfile(lang);
    const pageContexts = getLocalizedPageContexts(lang);

    if (!url || url === "unknown") {
      return profile.unknownPage;
    }

    const urlLower = url.toLowerCase();
    const pageConfig = pageContexts;

    for (const [basePath, description] of Object.entries(pageConfig)) {
      if (urlLower.includes(basePath.toLowerCase())) {
        return description;
      }
    }

    return `${profile.systemPage} ${this.config.ai.systemDomain}`;
  }

  /**
   * Calculate user tenure in months
   */
  calculateUserTenure(joinDate) {
    if (!joinDate) return 0;

    const now = new Date();
    const join = new Date(joinDate);
    return Math.floor((now - join) / (1000 * 60 * 60 * 24 * 30));
  }

  /**
   * Generate time context
   */
  getTimeContext(lang = this.config.ai.language) {
    const now = new Date();
    const locale = getLanguageProfile(lang).locale;

    return {
      currentDate: now.toLocaleDateString(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      currentTime: now.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
      month: now.toLocaleDateString(locale, { month: "long", year: "numeric" }),
      quarter: `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`,
      weekOfMonth: Math.ceil(now.getDate() / 7),
    };
  }

  /**
   * Generate system prompt from configuration
   */
  generateSystemPrompt(userContext, companyContext, activityContext, lang = this.config.ai.language) {
    const profile = getLanguageProfile(lang);
    const user = userContext;
    const stats = companyContext;
    const activity = activityContext;
    const time = this.getTimeContext(lang);
    const tenure = this.calculateUserTenure(
      user[this.config.userContext.fields.joinDate]
    );

    const userFields = this.config.userContext.fields;
    let userProfile = `**${user[userFields.name] || (lang === "en" ? "User" : lang === "zh" ? "用户" : "Pengguna")}** (${
      user[userFields.role] || (lang === "en" ? "Unknown Role" : lang === "zh" ? "未知角色" : "Unknown Role")
    })\n`;
    userProfile += `- ${lang === "en" ? "Email" : lang === "zh" ? "电子邮件" : "Email"}: ${user[userFields.email] || (lang === "en" ? "Unknown" : lang === "zh" ? "未知" : "Tidak diketahui")}\n`;
    userProfile += `- ${lang === "en" ? "Username" : lang === "zh" ? "用户名" : "Username"}: ${user[userFields.username] || (lang === "en" ? "Unknown" : lang === "zh" ? "未知" : "Tidak diketahui")}\n`;
    userProfile += `- ${lang === "en" ? "Role" : lang === "zh" ? "角色" : "Role"}: ${user[userFields.role] || (lang === "en" ? "Unknown" : lang === "zh" ? "未知" : "Tidak diketahui")}\n`;
    userProfile += `- Status: ${
      user[userFields.isActive]
        ? (lang === "en" ? "Active" : lang === "zh" ? "活跃" : "Aktif")
        : (lang === "en" ? "Inactive" : lang === "zh" ? "非活跃" : "Non-aktif")
    }\n`;
    userProfile += `- Bergabung: ${
      user[userFields.joinDate]
        ? new Date(user[userFields.joinDate]).toLocaleDateString(
            profile.locale
          )
        : (lang === "en" ? "Unknown" : lang === "zh" ? "未知" : "Tidak diketahui")
    }\n`;
    userProfile += `- ${lang === "en" ? "Tenure" : lang === "zh" ? "任职时长" : "Masa Kerja"}: ${tenure} ${lang === "en" ? "months" : lang === "zh" ? "bulan" : "bulan"}\n`;

    if (this.config.activityContext.enabled && activity) {
      userProfile += `- ${lang === "en" ? "Today Activities" : lang === "zh" ? "今日活动" : "Aktivitas Hari Ini"}: ${activity.today_activities || 0} ${lang === "en" ? "activities" : lang === "zh" ? "活动" : "aktivitas"}\n`;
      userProfile += `- ${lang === "en" ? "This Week Activities" : lang === "zh" ? "本周活动" : "Aktivitas Minggu Ini"}: ${activity.week_activities || 0} ${lang === "en" ? "activities" : lang === "zh" ? "活动" : "aktivitas"}\n`;
    }

    let companyProfile = "";
    if (this.config.companyContext.enabled && stats) {
      companyProfile = `## ${profile.systemContextTitle}\n`;
      companyProfile += `- ${lang === "en" ? "Total Users" : lang === "zh" ? "用户总数" : "Total Users"}: ${stats.total_users || 0} ${lang === "en" ? "users" : lang === "zh" ? "用户" : "orang"}\n`;
      companyProfile += `- ${lang === "en" ? "Active Users" : lang === "zh" ? "活跃用户" : "Users Aktif"}: ${stats.active_users || 0} ${lang === "en" ? "users" : lang === "zh" ? "用户" : "orang"}\n`;
      companyProfile += `- ${lang === "en" ? "Total Roles" : lang === "zh" ? "角色总数" : "Total Roles"}: ${stats.total_roles || 0} ${lang === "en" ? "roles" : lang === "zh" ? "角色" : "role"}\n\n`;
    }

    let analysisSection = `## ${profile.analysisTaskTitle}\n${profile.systemPromptIntro
      .replace("{role}", this.config.ai.systemRole)
      .replace("{domain}", this.config.ai.systemDomain)}\n${profile.responseLanguage}\n\n`;

    this.config.analysisFramework.sections.forEach((section) => {
      analysisSection += `### ${section.id.toUpperCase().replace(/_/g, " ")}\n`;
      section.points.forEach((point) => {
        analysisSection += `- ${point}\n`;
      });
      analysisSection += "\n";
    });

    const constraints = this.config.communication.constraints.join("\n- ");
    const principles = this.config.communication.principles.join("\n- ");
    const formatting = this.config.formatting.features.join("\n- ");

    return `${profile.systemPromptIntro
      .replace("{role}", this.config.ai.systemRole)
      .replace("{domain}", this.config.ai.systemDomain)}

## ${profile.userProfileTitle}
${userProfile}
${companyProfile}## ${profile.timeContextTitle}
- **${lang === "en" ? "Today" : lang === "zh" ? "今天" : "Hari ini"}**: ${time.currentDate}
- **${lang === "en" ? "Time" : lang === "zh" ? "Waktu" : "Waktu"}**: ${time.currentTime}
- **${lang === "en" ? "Month" : lang === "zh" ? "Bulan" : "Bulan"}**: ${time.month}
- **${lang === "en" ? "Quarter" : lang === "zh" ? "Kuartal" : "Kuartal"}**: ${time.quarter}
- **${lang === "en" ? "Week of month" : lang === "zh" ? "Minggu ke-" : "Minggu ke-"}**: ${time.weekOfMonth}

${analysisSection}## ${profile.responseFormatTitle}
${lang === "en" ? "Use" : lang === "zh" ? "使用" : "Gunakan"} format ${this.config.formatting.style} ${lang === "en" ? "that is structured" : lang === "zh" ? "yang terstruktur" : "yang terstruktur"}:
- ${formatting}

## ${profile.workConstraintsTitle}
- ${constraints}

## ${profile.communicationTitle}
- ${principles}`;
  }

  /**
   * Generate user message with context
   */
  generateUserMessage(
    screenContext,
    userQuery = null,
    pageUrl = "unknown",
    lang = this.config.ai.language
  ) {
    const pageContext = this.getPageContext(pageUrl, lang);

    if (userQuery) {
      return `**${lang === "en" ? "SPECIFIC QUESTION" : lang === "zh" ? "具体问题" : "PERTANYAAN SPESIFIK"}**: "${userQuery}"

**${lang === "en" ? "PAGE CONTEXT" : lang === "zh" ? "页面上下文" : "KONTEKS HALAMAN"}**: ${pageContext}
**URL**: ${pageUrl}

**${lang === "en" ? "SCREEN DATA" : lang === "zh" ? "屏幕数据" : "DATA LAYAR"}**:
${screenContext}`;
    }

    return `**${lang === "en" ? "PAGE CONTEXT" : lang === "zh" ? "页面上下文" : "KONTEKS HALAMAN"}**: ${pageContext}
**URL**: ${pageUrl}

**${lang === "en" ? "SCREEN DATA" : lang === "zh" ? "屏幕数据" : "DATA LAYAR"}**:
${screenContext}`;
  }

  /**
   * Get AI model configuration with global settings
   */
  async getAIModelConfig(modelId = null) {
    if (modelId) {
      const [models] = await this.db.query(
        `SELECT * FROM ai_models WHERE id = ? AND is_active = TRUE`,
        [modelId]
      );
      if (models.length === 0) {
        throw new Error("AI model not found or inactive");
      }
      return models[0];
    } else {
      // Get from global analysis settings
      const [activeSettings] = await this.db.query(`
        SELECT m.*, s.max_tokens, s.temperature
        FROM ai_analysis_settings s
        LEFT JOIN ai_models m ON s.selected_model_id = m.id
        WHERE s.is_active = TRUE AND m.is_active = TRUE
        ORDER BY s.updated_at DESC
        LIMIT 1
      `);

      if (activeSettings.length > 0) {
        return activeSettings[0];
      }

      // Fallback to first active model
      const [defaultModels] = await this.db.query(
        `SELECT * FROM ai_models WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1`
      );
      if (defaultModels.length === 0) {
        throw new Error("No AI models available");
      }
      return defaultModels[0];
    }
  }

  /**
   * Get system-wide AI analysis settings (admin controlled)
   */
  async getSystemAnalysisSettings() {
    const [activeSettings] = await this.db.query(`
      SELECT * FROM ai_analysis_settings WHERE is_active = TRUE ORDER BY updated_at DESC LIMIT 1
    `);

    if (activeSettings.length > 0) {
      const settings = activeSettings[0];
      return {
        temperature:
          parseFloat(settings.temperature) || this.config.ai.temperature,
        max_tokens:
          parseInt(settings.max_tokens, 10) || this.config.ai.maxTokens,
        enable_context:
          settings.enable_context !== undefined
            ? settings.enable_context
            : true,
        enable_company_stats:
          settings.enable_company_stats !== undefined
            ? settings.enable_company_stats
            : true,
        enable_activity_tracking:
          settings.enable_activity_tracking !== undefined
            ? settings.enable_activity_tracking
            : true,
        analysis_language:
          settings.analysis_language || this.config.ai.language,
      };
    }

    return {
      temperature: this.config.ai.temperature,
      max_tokens: this.config.ai.maxTokens,
      enable_context: true,
      enable_company_stats: true,
      enable_activity_tracking: true,
      analysis_language: this.config.ai.language,
    };
  }

  /**
   * Get AI completion configuration
   */
  async getAICompletionConfig() {
    const settings = await this.getSystemAnalysisSettings();
    return {
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
      stream: true,
    };
  }

  /**
   * Generate complete context for AI analysis
   */
  async generateAnalysisContext(userId, pageUrl = "unknown") {
    const [userContext, companyContext, activityContext] = await Promise.all([
      this.getUserContext(userId),
      this.getCompanyContext(),
      this.getActivityContext(userId),
    ]);

    const systemPrompt = this.generateSystemPrompt(
      userContext,
      companyContext,
      activityContext
    );

    return {
      systemPrompt,
      userContext,
      companyContext,
      activityContext,
      pageContext: this.getPageContext(pageUrl),
      timeContext: this.getTimeContext(),
    };
  }
}

module.exports = new AIAnalysisService();
