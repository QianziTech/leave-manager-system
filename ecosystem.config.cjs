const appName = process.env.PM2_APP_NAME || 'leave-manager-system'
const port = process.env.APP_PORT || process.env.PORT || '3000'
const env = {
  NODE_ENV: 'production',
  PORT: port,
  NUXT_PORT: port,
  NUXT_JWT_SECRET: process.env.NUXT_JWT_SECRET,
}

module.exports = {
  apps: [
    {
      name: appName,
      script: '.output/server/index.mjs',
      cwd: process.env.APP_CWD || '/www/leave-manager-system',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '384M',
      env,
      env_production: env,
    },
  ],
}
