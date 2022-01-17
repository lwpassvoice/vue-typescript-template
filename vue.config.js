// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

function resolve(dir) {
  return path.join(__dirname, dir);
}
module.exports = {
  // publicPath: './',
  lintOnSave: false,
  chainWebpack: (config) => {
    // 移除 preload
    config.plugins.delete('preload');
    // 移除 prefetch 插件
    config.plugins.delete('prefetch');
    config.plugins.delete('workbox');

    config.resolve.alias.set('@v1', resolve('v1/src'));
    // 默认title
    config.plugin('html').tap((options) => {
      const opts = options;
      opts[0].title = '';
      return opts;
    });

    // 分析
    if (process.env.VUE_APP_BUILD_ENV === 'analyzer') {
      config
        .plugin('webpack-bundle-analyzer')
        // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
        .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin);
    }
  },
};
