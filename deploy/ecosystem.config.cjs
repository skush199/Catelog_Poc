module.exports = {
  apps: [
    {
      name: "catalogai",
      cwd: "/var/www/catalogai",
      script: "node",
      args: "./apps/api/src/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "750M",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    }
  ]
};
