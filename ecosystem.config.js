module.exports = {
  apps: [
    {
      name: "omniflow-starter",
      script: "server.js",
      instances: "max", // Use all CPU cores in production
      exec_mode: "cluster", // Cluster mode for better performance

      // Environment variables
      env: {
        NODE_ENV: "development",
        PORT: 1234,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 1234,
        instances: "max",
        exec_mode: "cluster",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 1234,
        instances: 1,
        exec_mode: "fork",
        watch: true, // Enable watch in development
        watch_delay: 1000,
        ignore_watch: ["node_modules", "logs", "uploads", ".git", "*.log"],
      },

      // Process management
      max_memory_restart: "1G", // Restart if memory exceeds 1GB
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",

      // Logging configuration
      log_file: "./logs/pm2-combined.log",
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,

      // Health check and graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,

      // Process identification
      instance_var: "INSTANCE_ID",
    },
  ],

  // Deploy configuration (optional for production)
  deploy: {
    production: {
      user: "node",
      host: "your-server.com",
      ref: "origin/main",
      repo: "git@github.com:yourusername/omniflow-starter.git",
      path: "/var/www/omniflow-starter",
      "pre-deploy-local": "",
      "post-deploy":
        "npm ci --only=production && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
      env: {
        NODE_ENV: "production",
        PORT: 1234,
      },
    },
  },
};
