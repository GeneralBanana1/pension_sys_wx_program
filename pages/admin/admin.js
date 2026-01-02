// admin.js
const app = getApp();

Page({
  data: {
  },
  onLoad() {
    // 检查登录状态
    this.checkLogin();
  },
  onShow() {
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
  updateTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setTabList();
      this.getTabBar().setData({
        activeIndex: 2
      });
    }
  }
})