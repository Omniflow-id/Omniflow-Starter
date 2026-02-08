/**
 * AI Analysis Configuration
 * Global configuration for AI analysis functionality
 */

module.exports = {
  // AI Configuration
  ai: {
    temperature: 0.1,
    maxTokens: 4096,
    language: "id-ID",
    systemRole: "AI Assistant",
    systemDomain: "Omniflow Starter"
  },

  // User context configuration
  userContext: {
    query: `SELECT 
      u.id, u.username, u.full_name, u.email, u.role_id,
      r.role_name,
      u.is_active, u.created_at
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.role_id 
      WHERE u.id = ?`,
    fields: {
      id: 'id',
      name: 'full_name',
      email: 'email',
      role: 'role_name',
      username: 'username',
      isActive: 'is_active',
      joinDate: 'created_at'
    }
  },

  // Company/System context configuration
  companyContext: {
    enabled: true,
    query: `SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
      COUNT(DISTINCT role_id) as total_roles
      FROM users`
  },

  // Activity context configuration
  activityContext: {
    enabled: true,
    query: `SELECT 
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_activities,
      COUNT(CASE WHEN YEARWEEK(created_at) = YEARWEEK(NOW()) THEN 1 END) as week_activities
      FROM activity_logs WHERE user_id = ?`
  },

  // Page context mapping
  pageContext: {
    '/admin/overview': 'Dashboard Admin - Ringkasan aktivitas dan statistik sistem',
    '/admin/users': 'Manajemen Pengguna - Data dan administrasi user',
    '/admin/permissions': 'Manajemen Hak Akses - Roles dan permissions',
    '/admin/roles': 'Manajemen Roles - Daftar roles sistem',
    '/admin/log': 'Activity Logs - Log aktivitas sistem',
    '/admin/cache': 'Cache Management - Manajemen sistem caching',
    '/admin/queue': 'Queue Management - Manajemen job queue',
    '/admin/ai_models': 'Manajemen AI Models - Konfigurasi model AI',
    '/admin/ai_use_cases': 'Manajemen AI Use Cases - Use case AI',
    '/admin/ai_analysis_settings': 'Pengaturan AI Analysis - Konfigurasi global AI',
    '/admin/chat': 'AI Chat - Percakapan dengan AI Assistant',
    '/': 'Dashboard Utama - Halaman utama sistem'
  },

  // Analysis framework
  analysisFramework: {
    sections: [
      {
        id: 'data_analysis',
        points: [
          'Analisis mendalam data yang ditampilkan - identifikasi tren, pola, dan anomali',
          'Berikan interpretasi statistik jika relevan',
          'Kaitkan data dengan konteks bisnis',
          'Bandingkan dengan data historis yang relevan'
        ]
      },
      {
        id: 'performance_evaluation',
        points: [
          'Evaluasi performa berdasarkan data yang tersedia',
          'Identifikasi kekuatan dan area perbaikan',
          'Analisis faktor penyebab berdasarkan data'
        ]
      },
      {
        id: 'strategic_insights',
        points: [
          'Berikan insight strategis berdasarkan analisis data',
          'Identifikasi risiko dan opportunity',
          'Sarankan keputusan yang berbasis data',
          'Rekomendasi langkah tindak lanjut yang spesifik'
        ]
      },
      {
        id: 'navigation_assistance',
        points: [
          'JIKA user bertanya tentang cara menggunakan fitur, berikan panduan navigasi',
          'Jelaskan langkah-langkah berdasarkan fitur yang tersedia',
          'Referensikan menu atau halaman yang relevan'
        ]
      }
    ]
  },

  // Communication guidelines
  communication: {
    constraints: [
      'STRICTLY fokus pada data yang terlihat - tidak boleh membuat asumsi',
      'Berikan analisis yang mendalam dan substantif',
      'Semua klaim harus didukung oleh data yang tersedia',
      'Jika data tidak cukup, nyatakan dengan eksplisit keterbatasannya'
    ],
    principles: [
      'Analisis harus berbasis data (data-driven) dan objektif',
      'Struktur jawaban dengan hierarchy yang jelas',
      'Fokus pada actionable insights',
      'Berikan angka dan metrik spesifik saat memungkinkan'
    ]
  },

  // Formatting preferences
  formatting: {
    style: 'Markdown',
    features: [
      'Header dan subheader hierarkis untuk struktur',
      'Bullet points untuk daftar terstruktur',
      'Bold dan italic untuk emphasis',
      'Blockquotes untuk insight kunci'
    ]
  }
};
