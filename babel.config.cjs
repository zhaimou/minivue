// 解决jest模块化规范是node的comm.js问题
module.exports = {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',],
};
