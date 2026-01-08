module.exports = {
  apps : [{
    name: "tiller-bill-management",
    // We use the direct path to the next-server
    script: "./node_modules/next/dist/bin/next",
    // We pass 'start' as the only argument
    args: "start",
    exec_mode: "fork",
    instances: 1,
    env: {
      NODE_ENV: "production",
      PORT: 60
    }
  }]
}