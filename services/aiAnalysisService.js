/**
 * AI Analysis Service
 * Service layer for AI analysis functionality including context generation,
 * model configuration, and analysis settings management
 */

const { db } = require("@db/db");
const config = require("@config/ai-analysis-config");

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
  getPageContext(url) {
    if (!url || url === "unknown") {
      return "Halaman tidak diketahui";
    }

    const urlLower = url.toLowerCase();
    const pageConfig = this.config.pageContext;

    for (const [basePath, description] of Object.entries(pageConfig)) {
      if (urlLower.includes(basePath.toLowerCase())) {
        return description;
      }
    }

    return `Halaman Sistem ${this.config.ai.systemDomain}`;
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
  getTimeContext() {
    const now = new Date();
    const locale = this.config.ai.language;

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
  generateSystemPrompt(userContext, companyContext, activityContext) {
    const user = userContext;
    const stats = companyContext;
    const activity = activityContext;
    const time = this.getTimeContext();
    const tenure = this.calculateUserTenure(
      user[this.config.userContext.fields.joinDate]
    );

    const userFields = this.config.userContext.fields;
    let userProfile = `**${user[userFields.name] || "Pengguna"}** (${
      user[userFields.role] || "Unknown Role"
    })\n`;
    userProfile += `- Email: ${user[userFields.email] || "Tidak diketahui"}\n`;
    userProfile += `- Username: ${user[userFields.username] || "Tidak diketahui"}\n`;
    userProfile += `- Role: ${user[userFields.role] || "Tidak diketahui"}\n`;
    userProfile += `- Status: ${
      user[userFields.isActive] ? "Aktif" : "Non-aktif"
    }\n`;
    userProfile += `- Bergabung: ${
      user[userFields.joinDate]
        ? new Date(user[userFields.joinDate]).toLocaleDateString(
            this.config.ai.language
          )
        : "Tidak diketahui"
    }\n`;
    userProfile += `- Masa Kerja: ${tenure} bulan\n`;

    if (this.config.activityContext.enabled && activity) {
      userProfile += `- Aktivitas Hari Ini: ${activity.today_activities || 0} aktivitas\n`;
      userProfile += `- Aktivitas Minggu Ini: ${activity.week_activities || 0} aktivitas\n`;
    }

    let companyProfile = "";
    if (this.config.companyContext.enabled && stats) {
      companyProfile = `## KONTEKS SISTEM\n`;
      companyProfile += `- Total Users: ${stats.total_users || 0} orang\n`;
      companyProfile += `- Users Aktif: ${stats.active_users || 0} orang\n`;
      companyProfile += `- Total Roles: ${stats.total_roles || 0} role\n\n`;
    }

    let analysisSection = `## TUGAS ANALISIS\nSebagai ${this.config.ai.systemRole} ${this.config.ai.systemDomain}, lakukan analisis mendalam dengan fokus:\n\n`;

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

    return `Anda adalah ${this.config.ai.systemRole} ${this.config.ai.systemDomain} yang ahli dalam analisis data sistem.

## PROFIL PENGGUNA
${userProfile}
${companyProfile}## KONTEKS WAKTU
- **Hari ini**: ${time.currentDate}
- **Waktu**: ${time.currentTime}
- **Bulan**: ${time.month}
- **Kuartal**: ${time.quarter}
- **Minggu ke-**: ${time.weekOfMonth} bulan ini

${analysisSection}## FORMAT RESPONS
Gunakan format ${this.config.formatting.style} yang terstruktur:
- ${formatting}

## BATASAN KERJA
- ${constraints}

## GAYA KOMUNIKASI
- ${principles}`;
  }

  /**
   * Generate user message with context
   */
  generateUserMessage(screenContext, userQuery = null, pageUrl = "unknown") {
    const pageContext = this.getPageContext(pageUrl);

    if (userQuery) {
      return `**PERTANYAAN SPESIFIK**: "${userQuery}"

**KONTEKS HALAMAN**: ${pageContext}
**URL**: ${pageUrl}

**DATA LAYAR**:
${screenContext}`;
    }

    return `**KONTEKS HALAMAN**: ${pageContext}
**URL**: ${pageUrl}

**DATA LAYAR**:
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
        max_tokens: parseInt(settings.max_tokens) || this.config.ai.maxTokens,
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
