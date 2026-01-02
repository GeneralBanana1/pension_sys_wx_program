// user.js
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
      this.getTabBar().updateActiveIndex();
      this.getTabBar().setData({
        activeIndex: 1
      });
    }
  },
  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 显示加载动画
          wx.showLoading({
            title: '退出中...',
            mask: true
          });
          
          setTimeout(() => {
            // 调用全局退出登录方法，清空token和登录状态
            app.logout();
            
            // 跳转到登录页面
            wx.redirectTo({
              url: '/pages/login/login',
              complete: () => {
                wx.hideLoading();
              }
            });
          }, 300);
        }
      }
    });
  }
})