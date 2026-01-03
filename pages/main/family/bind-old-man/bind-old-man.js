// family/bind-old-man/bind-old-man.js - 亲属端绑定老人页面
const app = getApp();

Page({
  data: {
    // 绑定老人表单数据
    bindForm: {
      oldManId: '',
      oldManName: '',
      relationship: ''
    },
    // 搜索相关
    searchParams: {
      nickName: '', // 老人姓名
      phonenumber: '' // 电话号码
    },
    searchResults: [], // 搜索结果列表
    searchLoading: false, // 搜索加载状态
    showSearchResults: false, // 是否显示搜索结果
    // 已绑定老人列表
    boundOldManList: [], // 已绑定的老人列表
    boundLoading: false // 加载已绑定老人列表的状态
  },

  onLoad() {
    // 页面加载时的初始化
    this.loadBoundOldManList(); // 加载已绑定的老人列表
  },

  // 表单输入变化
  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    var data = {};
    data['bindForm.' + field] = value;
    this.setData(data);
  },

  // 搜索输入变化
  onSearchInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    var data = {};
    data['searchParams.' + field] = value;
    this.setData(data);
    
    // 执行搜索
    this.searchOldMan();
  },

  // 搜索老人
  searchOldMan() {
    this.setData({ searchLoading: true });
    
    var token = app.globalData.token;
    if (!token) {
      token = wx.getStorageSync('token');
    }
    
    var searchParams = this.data.searchParams;
    var that = this;
    
    // 检查是否有搜索条件
    if (!searchParams.nickName.trim() && !searchParams.phonenumber.trim()) {
      that.setData({
        searchResults: [],
        showSearchResults: false,
        searchLoading: false
      });
      return;
    }
    
    wx.request({
      url: app.globalData.baseUrl + '/user/info/old/list',
      method: 'GET',
      data: {
        nickName: searchParams.nickName, // 使用姓名搜索
        phonenumber: searchParams.phonenumber // 使用电话号码搜索
      },
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      success: function(res) {
        console.log('搜索老人成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          that.setData({
            searchResults: res.data.data,
            showSearchResults: true
          });
        } else {
          wx.showToast({
            title: '搜索失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        console.error('搜索老人失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      },
      complete: function() {
        that.setData({ searchLoading: false });
      }
    });
  },

  // 选择搜索结果
  selectSearchResult(e) {
    const index = e.currentTarget.dataset.index;
    const selectedUser = this.data.searchResults[index];
    
    // 将选择的用户信息填充到表单中
    this.setData({
      'bindForm.oldManId': selectedUser.userId,
      'bindForm.oldManName': selectedUser.nickName,
      showSearchResults: false,
      // 清空搜索参数
      searchParams: {
        nickName: '',
        phonenumber: ''
      }
    });
  },

  // 关闭搜索结果
  closeSearchResults() {
    this.setData({
      showSearchResults: false
    });
  },

  // 提交绑定老人表单
  submitBindForm() {
    var bindForm = this.data.bindForm;
    var oldManId = bindForm.oldManId;
    var oldManName = bindForm.oldManName;
    var relationship = bindForm.relationship;
    
    if (!oldManId || !oldManName) {
      wx.showToast({
        title: '请先搜索并选择一位老人',
        icon: 'none'
      });
      return;
    }
    
    if (!relationship) {
      wx.showToast({
        title: '请输入与老人的关系',
        icon: 'none'
      });
      return;
    }
    
    // 获取当前用户ID作为familyId
    var userInfo = app.globalData.userInfo;
    // 如果全局用户信息为空，尝试从本地存储获取
    if (!userInfo || !userInfo.userId) {
      userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.userId) {
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
        return;
      }
    }
    
    var familyId = userInfo.userId;
    var oldId = oldManId;
    
    // 调用API绑定老人
    var token = app.globalData.token;
    if (!token) {
      token = wx.getStorageSync('token');
    }
    
    var that = this;
    wx.request({
      url: app.globalData.baseUrl + '/user/info/old/family',
      method: 'POST',
      data: {
        familyId: familyId,
        oldId: oldId,
        relationship: relationship
      },
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      success: function(res) {
        console.log('绑定老人API响应:', res.data);
        
        if (res.statusCode === 200 && res.data.code === 200) {
            wx.showToast({
              title: '绑定成功',
              icon: 'success'
            });
            
            // 绑定成功后重新加载已绑定老人列表
            that.loadBoundOldManList();
            
            // 清空表单
            that.setData({
              bindForm: {
                oldManId: '',
                oldManName: '',
                relationship: ''
              }
            });
          } else {
            wx.showToast({
              title: res.data.msg || '绑定失败',
              icon: 'none'
            });
          }
      },
      fail: function(err) {
        console.error('绑定老人API请求失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  // 加载已绑定的老人列表
  loadBoundOldManList() {
    // 显示加载状态
    this.setData({ boundLoading: true });
    
    var token = app.globalData.token;
    if (!token) {
      token = wx.getStorageSync('token');
    }
    
    var that = this;
    // 调用与主页相同的API获取已绑定的老人列表
    wx.request({
      url: app.globalData.baseUrl + '/user/info/old/family',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      success: function(res) {
        console.log('获取已绑定老人列表成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          // 直接使用返回的数据，不需要处理，因为API返回的是已绑定的老人列表
          that.setData({
            boundOldManList: res.data.data
          });
        } else {
          console.error('获取已绑定老人列表失败:', res.data.msg);
          wx.showToast({
            title: '获取已绑定老人列表失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        console.error('请求已绑定老人列表API失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      },
      complete: function() {
        that.setData({ boundLoading: false });
      }
    });
  },

  // 解绑老人
  unbindOldMan(e) {
    var oldId = e.currentTarget.dataset.oldid;
    if (!oldId) {
      wx.showToast({
        title: '获取老人ID失败',
        icon: 'none'
      });
      return;
    }
    
    // 显示确认对话框
    var that = this;
    wx.showModal({
      title: '解绑确认',
      content: '确定要解绑该老人吗？',
      success: function(res) {
        if (res.confirm) {
          // 用户点击确定，执行解绑操作
          that.doUnbind(oldId);
        } else if (res.cancel) {
          // 用户点击取消，不执行操作
          console.log('用户取消了解绑操作');
        }
      }
    });
  },

  // 执行解绑操作
  doUnbind(oldId) {
    var token = app.globalData.token;
    if (!token) {
      token = wx.getStorageSync('token');
    }
    
    var that = this;
    wx.request({
      url: app.globalData.baseUrl + '/user/info/old/family/' + oldId, // 正确的DELETE请求URL
      method: 'DELETE',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      success: function(res) {
        console.log('解绑老人API响应:', res.data);
        
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '解绑成功',
            icon: 'success'
          });
          
          // 解绑成功后重新加载已绑定老人列表
          that.loadBoundOldManList();
        } else {
          wx.showToast({
            title: res.data.msg || '解绑失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        console.error('解绑老人API请求失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});