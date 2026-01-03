// pages/main/old/personal/personal.js
var app = getApp()
Page({
  data: {
    // 用户信息
    userInfo: {
      id: '',
      name: '微信用户',
      email: '暂无',
      phone: '暂无',
      remark: '暂无',
      sex: '暂无',
      avatar: ''
    },
    
    // 紧急联系人列表，最多显示两个
    emergencyContacts: [],
    
    loading: false
  },

  onLoad: function() {
    this.loadUserData();
  },

  onShow: function() {
    // 每次显示时刷新数据
    this.loadUserData();
    // 更新底部导航栏高亮状态
    this.updateTabBarActive();
  },
  
  // 更新底部导航栏高亮状态
  updateTabBarActive: function() {
    // 获取当前页面路径
    var pages = getCurrentPages();
    if (pages.length > 0) {
      var currentPage = pages[pages.length - 1];
      var currentPath = currentPage.route;
      // 触发自定义tabBar的更新
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().updateActiveIndex();
      }
    }
  },

  // 加载用户数据
  loadUserData: function() {
    this.setData({
      loading: true
    });
    
    try {
      // 直接从全局变量获取用户信息，登录时已经查询过
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
      console.log('从全局变量获取用户信息:', userInfo);
      
      if (userInfo) {
        this.setDisplayData(userInfo);
        // 缓存用户信息
        wx.setStorageSync('userProfileData', userInfo);
        // 获取紧急联系人信息
        this.getEmergencyContacts(userInfo);
      } else {
        console.error('用户信息不存在');
        wx.showToast({
          title: '用户信息不存在',
          icon: 'none'
        });
        this.setData({
          loading: false
        });
      }
    } catch (error) {
      console.error('处理用户信息失败:', error);
      wx.showToast({
        title: '处理用户信息失败',
        icon: 'none'
      });
      this.setData({
        loading: false
      });
    }
  },
  
  // 获取紧急联系人信息
  getEmergencyContacts(userInfo) {
    const token = wx.getStorageSync('token');
    const userId = userInfo.userId || userInfo.id || userInfo.customerId || 0;
    
    if (!userId) {
      console.error('用户ID不存在');
      this.setData({
        loading: false
      });
      return;
    }
    
    // 调用联系人查询接口，获取isDefault=1的紧急联系人
    wx.request({
      url: app.globalData.baseUrl + '/contacts/list',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token // 携带token
      },
      data: {
        pageNum: 1,
        pageSize: 10,
        customerId: userId, // 参数名为customerId，值为userId
        isDefault: 1 // 只查询紧急联系人
      },
      success: (res) => {
        console.log('获取紧急联系人成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          const { rows } = res.data;
          // 最多显示两个紧急联系人
          const emergencyContacts = rows && rows.length > 0 ? rows.slice(0, 2) : [];
          this.setData({
            emergencyContacts
          });
        } else {
          console.error('获取紧急联系人失败:', res.data.message);
          this.setData({
            emergencyContacts: []
          });
        }
      },
      fail: (err) => {
        console.error('请求紧急联系人API失败:', err);
        this.setData({
          emergencyContacts: []
        });
      },
      complete: () => {
        this.setData({
          loading: false
        });
      }
    });
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
      name: data.name || data.nickName || '微信用户',
      email: data.email || data.Email || '暂无',
      phone: data.phone || data.phonenumber || '暂无',
      remark: data.remark || '暂无',
      sex: sexText,
      emergencyName: '暂无',
      emergencyPhone: '暂无',
      emergencyRelation: '暂无',
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