module.exports = {
    apps: [
        {
            name: 'Lighthouse',
            instances: 1,
            autorestart: false, // Automatically restart on crashes
            watch: false, // Re
            env: {
                NODE_ENV: 'production',
                PORT: 8080,
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 8080,
            },
            env_test: {
                NODE_ENV: 'test',
                PORT: 8080,
            },
            error_file: './err.log',
            out_file: './out.log',
            log_file: './combined.log',
            time: true,
            wait_ready: true,
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
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
        }
    }
};