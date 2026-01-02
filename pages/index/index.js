// index.js
const app = getApp();

Page({
  data: {
    currentRole: app.globalData.currentRole,
    roleNames: {
      '100': '老人',
      '101': '家属',
      '102': '护工',
      '103': '维修工'
    }
  },
  onLoad() {
    // 检查登录状态
    this.checkLogin();
  },
  onShow() {
    this.setData({
      currentRole: app.globalData.currentRole
    });
    // 更新自定义tabBar
    this.updateTabBar();
  },
  checkLogin() {
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      });
    }
  },
  switchToRole(e) {
    const role = e.currentTarget.dataset.role;
    app.switchRole(role);
    this.setData({
      currentRole: role
    });
    this.updateTabBar();
  },
  getRoleName(roleId) {
    return this.data.roleNames[roleId] || '未知角色';
  },
  updateTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setTabList();
      this.getTabBar().setData({
        activeIndex: 0
      });
    }
  }
})
