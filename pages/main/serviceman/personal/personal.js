// pages/main/serviceman/personal/personal.js
const app = getApp()
Page({
  data: {
    // 用户信息
    userInfo: {
      id: '',
      name: '服务人员',
      email: '暂无',
      phone: '暂无',
      remark: '暂无',
      sex: '暂无',
      avatar: ''
    },
    loading: false
  },

  onLoad() {
    this.loadUserData();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadUserData();
    // 更新底部导航栏高亮状态
    this.updateTabBarActive();
  },
  
  // 更新底部导航栏高亮状态
  updateTabBarActive() {
    // 获取当前页面路径
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      const currentPath = currentPage.route;
      // 触发自定义tabBar的更新
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().updateActiveIndex();
      }
    }
  },

  // 加载用户数据
  loadUserData() {
    this.setData({
      loading: true
    });
    
    try {
      // 直接从全局变量获取用户信息，登录时已经查询过
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
      console.log('从全局变量获取用户信息:', userInfo);
      
      if (userInfo) {
        this.setDisplayData(userInfo);
      } else {
        console.error('用户信息不存在');
        wx.showToast({
          title: '用户信息不存在',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('处理用户信息失败:', error);
      wx.showToast({
        title: '处理用户信息失败',
        icon: 'none'
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },
  
  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 直接跳转到登录页面，避免在退出过程中请求数据
          wx.reLaunch({
            url: '/pages/login/login'
          });
          // 调用app的logout方法
          app.logout();
        }
      }
    });
  },

  // 设置显示数据
  setDisplayData(data) {
    console.log('设置显示数据:', data);
    
    // 处理性别显示
    const sexText = data.sex === '1' ? '男' : data.sex === '0' ? '女' : '暂无';
    
    // 创建完整的用户信息对象，包含所有需要显示的属性
    const userInfo = {
      id: data.id || data.userId || '',
      name: data.name || data.nickName || '服务人员',
      email: data.email || data.Email || '暂无',
      phone: data.phone || data.phonenumber || '暂无',
      remark: data.remark || '暂无',
      sex: sexText,
      avatar: data.avatar || ''
    };
    
    // 直接替换整个userInfo对象，确保数据能正确渲染
    this.setData({
      userInfo
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUserData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '信息已更新',
        icon: 'success'
      });
    }, 1000);
  }
});