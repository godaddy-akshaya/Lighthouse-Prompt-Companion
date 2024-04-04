module.exports = {
    apps: [
        {
            name: 'dev-lighthouse',
            instances: 1,
            autorestart: false, // Automatically restart on crashes
            watch: false, // Restart on file changes
            script: 'gasket start --env development',
            env_development: {
                NODE_ENV: 'development',
                PORT: 8080,
            }
        },
        {
            name: 'prod-lighthouse',
            script: 'gasket start --env production',
            env_production: {
                NODE_ENV: 'production',
                PORT: 8080,

            },
            error_file: './err.log',
            out_file: './out.log',
            log_file: './combined.log',
            time: true,
            listen_timeout: 50000,
            kill_timeout: 5000,
        },
    ],
    deploy: {
        production: {
            user: 'node',
            host: 'lighthouse.c3.int.gdcorp.tools',
            ref: 'origin/master',
            repo: 'git@github.com:repo.git',
            path: '/var/www/development',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production --only prod-lighthouse',
        }
    }
};