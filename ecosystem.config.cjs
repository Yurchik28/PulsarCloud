module.exports = {
  apps: [{
    name: 'kirovskdc',
    script: './dist/index.js',
    cwd: '/root/kirovskdc-website-openstack',
    env: {
      DATABASE_URL: 'mysql://root:Kirovsk2026@127.0.0.1:3306/kirovskdc_db',
      JWT_SECRET: 'kirovskdc-super-secret-jwt-key-2026-minimum-32-chars',
      PORT: '3000',
      NODE_ENV: 'production',
      OAUTH_SERVER_URL: 'http://159.194.209.30',
      CONTROL_NODE_URL: 'http://85.198.103.96:8000',
      CONTROL_NODE_API_KEY: 'c6bf3b88c156ea5eea42a479212c7f9a24141785a6a5d428d06b3e51cf486628',
    }
  }]
}
