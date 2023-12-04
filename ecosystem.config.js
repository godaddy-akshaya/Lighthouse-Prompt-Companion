module.exports = {
  apps: [
    {
      name: 'scui-uxcore-dev',
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
      host: 'scui-uxcore.c3.int.dev-gdcorp.tools',
      'pre-deploy': 'git pull',
      ref: 'origin/dev',
      repo: 'git@github.com:gdcorp-dna/scui-uxcore.git',
      path: '/var/www/scui-uxcore',
      'post-deploy':
        'npm install && pm2 startOrReload ecosystem.config.js --env=development --only scui-uxcore-dev',
    },
    // production: {
    //   user: 'jhanes',
    //   host: ['scdb.c3.int.gdcorp.tools'],
    //   'pre-deploy': 'git pull',
    //   ref: 'origin/main',
    //   repo: 'git@github.com:jhanes-godaddy/scorecard-api.git',
    //   path: '/home/jhanes/scdb-prod',
    //   'post-deploy':
    //     'npm install && pm2 startOrReload ecosystem.config.js --env production --only scdb-prod',
    // },
  },
};
