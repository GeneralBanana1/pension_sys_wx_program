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
    loading: false,
    
    // 编辑信息相关
    showEditModal: false,
    editForm: {
      nickName: '',
      email: '',
      phonenumber: '',
      sex: '',
      remark: ''
    }
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
    
    // 从服务器重新获取用户信息
    const token = wx.getStorageSync('token');
    
    wx.request({
      url: app.globalData.baseUrl + '/user/info/getUserInfo',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token
      },
      success: (res) => {
        console.log('从服务器获取用户信息:', res.data);
        
        if (res.data && res.data.code === 200) {
          const userInfo = res.data.data || {};
          // 更新全局用户信息
          app.globalData.userInfo = userInfo;
          wx.setStorageSync('userInfo', userInfo);
          // 设置显示数据
          this.setDisplayData(userInfo);
        } else {
          console.error('获取用户信息失败:', res.data.message);
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('请求获取用户信息API失败:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        // 失败时尝试从本地获取
        try {
          const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
          if (userInfo) {
            this.setDisplayData(userInfo);
          }
        } catch (error) {
          console.error('处理本地用户信息失败:', error);
        }
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
  },
  
  // 显示编辑模态框
  showEditModal() {
    // 将当前用户信息填充到编辑表单
    const userInfo = this.data.userInfo;
    this.setData({
      editForm: {
        nickName: userInfo.name || '',
        email: userInfo.email || '',
        phonenumber: userInfo.phone || '',
        sex: userInfo.sex === '男' ? '1' : userInfo.sex === '女' ? '0' : '',
        remark: userInfo.remark || ''
      },
      showEditModal: true
    });
  },
  
  // 隐藏编辑模态框
  hideEditModal() {
    this.setData({
      showEditModal: false
    });
  },
  
  // 提交编辑表单
  submitEditForm(e) {
    const formData = e.detail.value;
    console.log('提交的表单数据:', formData);
    
    // 基本验证
    if (!formData.nickName.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }
    
    // 准备API请求数据
    const userInfo = this.data.userInfo;
    const userId = userInfo.id || userInfo.userId || '';
    
    if (!userId) {
      wx.showToast({
        title: '用户ID不存在',
        icon: 'none'
      });
      return;
    }
    
    const requestData = {
      userId: parseInt(userId),
      nickName: formData.nickName.trim(),
      avatar: userInfo.avatar || '',
      phonenumber: formData.phonenumber.trim(),
      email: formData.email.trim(),
      sex: formData.sex || '1', // 默认男性
      remark: formData.remark.trim()
    };
    
    console.log('准备发送的API数据:', requestData);
    
    // 调用API更新用户信息
    this.updateUserInfo(requestData);
  },
  
  // 更新用户信息API调用
  updateUserInfo(data) {
    const token = wx.getStorageSync('token');
    
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    wx.request({
      url: app.globalData.baseUrl + '/user/info/update',
      method: 'PUT',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: data,
      success: (res) => {
        console.log('更新用户信息成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          // 更新成功，隐藏模态框，重新加载数据
          this.hideEditModal();
          this.loadUserData();
          
          wx.showToast({
            title: '信息更新成功',
            icon: 'success',
            duration: 1500
          });
          
          // 更新全局用户信息
          const updatedUserInfo = { ...app.globalData.userInfo, ...data };
          app.globalData.userInfo = updatedUserInfo;
          wx.setStorageSync('userInfo', updatedUserInfo);
        } else {
          console.error('更新用户信息失败:', res.data.message);
          wx.showToast({
            title: res.data.message || '更新失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('请求更新用户信息API失败:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },
  
  // 空函数，用于阻止事件冒泡
  noop() {
    // 不执行任何操作
  }
});