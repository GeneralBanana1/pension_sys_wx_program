// role-select.js
const app = getApp();

Page({
  data: {
    loading: false,
    // API配置
    baseUrl: 'http://localhost:8080',
    api: {
      // 用户授权角色接口POST
      authRole: '/user/info/role'
    }
  },
  onLoad() {
  },
  selectRole(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({ loading: true });
    
    // 显示加载动画
    wx.showLoading({
      title: '设置角色中...',
      mask: true
    });
    
    // 获取userId
    const userId = app.globalData.userInfo?.userId || 0;
    
    // 调用设置角色接口
    wx.request({
      url: this.data.baseUrl + this.data.api.authRole,
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      data: {
        roleId: parseInt(role),
        userId: userId
      },
      success: (res) => {
        console.log('设置角色响应：', res);
        
        if (res.data && (res.data.code === 200 || res.data.code === 0)) {
          // 设置当前角色
          app.switchRole(role);
          wx.showToast({
            title: '角色选择成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              // 跳转到首页
              setTimeout(() => {
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }, 1500);
            }
          });
        } else {
          wx.showToast({ title: '角色设置失败：' + (res.data.msg || '未知错误'), icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('设置角色请求失败：', err);
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
        wx.hideLoading();
      }
    });
  }
})