module.exports = {
  apps: [
    {
      name: 'lighthouse-ui-dev',
      instances: 1,
      port: 8080,
      autorestart: false, // Automatically restart on crashes
      watch: false, // Restart on file changes
      script: 'gasket local --env=development',
      env: {
        NODE_ENV: 'development',
        PORT: 8080,
      }
    },
  ],
  deploy: {
    development: {
      user: 'jhanes',
      host: 'prompt-ui.c3.int.dev-gdcorp.tools',
      'pre-deploy': 'git pull',
      ref: 'origin/main',
      repo: 'git@github.com:gdcorp-dna/lighthouse-ui.git',
      path: '/var/www/prompt-ui',
      'post-deploy':
        'npm install && pm2 startOrReload ecosystem.config.js --env=development --only lighthouse-ui-dev',
    },
  },
};
