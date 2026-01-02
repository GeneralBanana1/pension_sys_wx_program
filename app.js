// app.js
App({
  globalData: {
    isLoggedIn: false, // 登录状态
    token: '', // 用户token
    userInfo: null, // 用户信息
    baseUrl: 'http://localhost:8080', // API基础地址
    currentRole: '100', // 默认角色：老人100, 家属101, 护工102, 维修工103
    roleTabs: {
      '100': [ // 老人
        { pagePath: 'pages/main/old/index/index', text: '首页', iconPath: '', selectedIconPath: '' },
        { pagePath: 'pages/main/old/personal/personal', text: '个人中心', iconPath: '', selectedIconPath: '' }
      ],
      '101': [ // 家属
        { pagePath: 'pages/index/index', text: '首页', iconPath: '', selectedIconPath: '' },
        { pagePath: 'pages/user/user', text: '老人管理', iconPath: '', selectedIconPath: '' },
        { pagePath: 'pages/admin/admin', text: '服务记录', iconPath: '', selectedIconPath: '' },
        { pagePath: 'pages/main/health/health', text: '健康管理', iconPath: '', selectedIconPath: '' }
      ],
      '102': [ // 护工
        { pagePath: 'pages/index/index', text: '首页', iconPath: '', selectedIconPath: '' },
        { pagePath: 'pages/user/user', text: '服务管理', iconPath: '', selectedIconPath: '' },
        { pagePath: 'pages/admin/admin', text: '老人信息', iconPath: '', selectedIconPath: '' }
      ],
      '103': [ // 维修工
        { pagePath: 'pages/index/index', text: '首页', iconPath: '', selectedIconPath: '' },
        { pagePath: 'pages/user/user', text: '维修工单', iconPath: '', selectedIconPath: '' }
      ]
    }
  },
  onLaunch() {
    // 从本地存储获取token和登录状态
    const token = wx.getStorageSync('token');
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const currentRole = wx.getStorageSync('currentRole');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && isLoggedIn) {
      this.globalData.token = token;
      this.globalData.isLoggedIn = isLoggedIn;
      this.globalData.currentRole = currentRole || '100';
      this.globalData.userInfo = userInfo;
    }
  },
  // 登录
  login(token) {
    this.globalData.isLoggedIn = true;
    this.globalData.token = token;
    // 保存到本地存储
    wx.setStorageSync('token', token);
    wx.setStorageSync('isLoggedIn', true);
  },
  // 设置用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },
  // 切换角色
  switchRole(role) {
    this.globalData.currentRole = role;
    wx.setStorageSync('currentRole', role);
  },
  // 退出登录
  logout() {
    this.globalData.isLoggedIn = false;
    this.globalData.token = '';
    this.globalData.userInfo = null;
    this.globalData.currentRole = '100';
    // 清除本地存储
    wx.removeStorageSync('token');
    wx.removeStorageSync('isLoggedIn');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('currentRole');
  }
})
