module.exports = {
  apps: [
    {
      name: "omniflow-starter",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 1234
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 1234
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm Z"
    }
  ]
};