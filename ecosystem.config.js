module.exports = {
  apps: [
    {
      name: "Omniflow-Starter",
      script: "server.js",
      port: 8203,
      max_memory_restart: "1G",
      instances: 1,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "1m",
      watch: false,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
        PORT: 8203,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8203,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
  ],
};
