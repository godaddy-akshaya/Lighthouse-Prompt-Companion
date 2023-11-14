module.exports = {
  plugins: {
    presets: [
      '@godaddy/webapp'
    ]
  },
  helmet: {
    contentSecurityPolicy: false
  },
  presentationCentral: {
    params: {
      app: 'prompt-ui',
      header: 'internal-header',
      uxcore: '2301'
    }
  }
};
