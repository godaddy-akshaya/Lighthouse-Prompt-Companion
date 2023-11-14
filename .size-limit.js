module.exports = [
  {
    name: 'chunks',
    path: '.next/static/chunks/*.js',
    brotli: true,
    webpack: false,
    limit: '62 KB'

  },
  {
    name: 'pages',
    path: '.next/static/chunks/pages/*.js',
    brotli: true,
    webpack: false,
    limit: '15 KB'
  },
  {
    name: 'styles',
    path: '.next/static/css/*.css',
    brotli: true,
    webpack: false
  }
];
