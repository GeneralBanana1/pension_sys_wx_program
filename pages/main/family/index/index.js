// family/index.js - 亲属端主页
const app = getApp();

Page({
  data: {
    // 加载状态
    loading: false,
    // 当前选择的老人
    selectedOldMan: null,
    // 老人列表
    oldManList: [],
    // 功能菜单列表
    menuList: [
      {
        icon: '👥',
        title: '联系人管理',
        desc: '管理老人的联系人',
        path: '/pages/main/family/contacts/contacts'
      },
      {
        icon: '💊',
        title: '用药管理',
        desc: '管理老人的用药计划',
        path: '/pages/main/family/medication/medication'
      },
      {
        icon: '❤️',
        title: '健康管理',
        desc: '查看老人健康数据',
        path: '/pages/main/family/health/health'
      },
      {
        icon: '📋',
        title: '服务请求',
        desc: '管理服务订单',
        path: '/pages/main/family/help/help'
      }
    ]
  },

  onLoad() {
    this.loadOldManList();
    this.updateTabBarActive();
  },

  onShow() {
    this.loadOldManList();
    this.updateTabBarActive();
  },

  // 计算当前选中老人的索引
  getSelectedIndex() {
    var oldManList = this.data.oldManList;
    var selectedOldMan = this.data.selectedOldMan;
    if (!selectedOldMan) {
      return 0;
    }
    for (var i = 0; i < oldManList.length; i++) {
      if (oldManList[i].id === selectedOldMan.id) {
        return i;
      }
    }
    return 0;
  },

  // 更新底部导航栏高亮状态
  updateTabBarActive() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateActiveIndex();
    }
  },

  // 加载老人列表
  loadOldManList() {
    // 显示加载状态
    this.setData({
      loading: true
    });
    
    var token = app.globalData.token;
    if (!token) {
      token = wx.getStorageSync('token');
    }
    
    // 调用API获取绑定的老人列表
    var that = this;
    wx.request({
      url: app.globalData.baseUrl + '/user/info/old/family',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      success: function(res) {
        console.log('获取老人列表成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          // 处理返回的数据，将oldId映射为id，nickName映射为name，使用返回的relationship
          var oldManList = res.data.data;
          var processedList = [];
          for (var i = 0; i < oldManList.length; i++) {
            var item = oldManList[i];
            processedList.push({
              id: item.oldId,
              name: item.nickName,
              relationship: item.relationship // 使用API返回的关系字段
            });
          }
          
          var selectedOldMan = null;
          var selectedIndex = 0;
          
          // 获取之前选择的老人ID（优先从本地存储获取，确保页面重新加载时也能恢复）
          var previousSelectedId = wx.getStorageSync('selectedOldManId');
          // 如果本地存储没有，再从全局数据获取
          if (!previousSelectedId && app.globalData.currentOldMan && app.globalData.currentOldMan.id) {
            previousSelectedId = app.globalData.currentOldMan.id;
          }
          
          // 查找之前选择的老人是否在列表中
          var hasSelected = false;
          for (var j = 0; j < processedList.length; j++) {
            if (processedList[j].id === previousSelectedId) {
              selectedOldMan = processedList[j];
              selectedIndex = j;
              hasSelected = true;
              break;
            }
          }
          
          // 如果没有之前选择的老人或之前选择的老人不在列表中，默认选择第一个
          if (!hasSelected && processedList.length > 0) {
            selectedOldMan = processedList[0];
            selectedIndex = 0;
          }
          
          that.setData({
            oldManList: processedList,
            selectedOldMan: selectedOldMan,
            selectedIndex: selectedIndex
          });
          
          // 更新全局数据中的当前选择老人
          app.globalData.currentOldMan = selectedOldMan;
        } else {
          console.error('获取老人列表失败:', res.data.msg);
          wx.showToast({
            title: '获取老人列表失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        console.error('请求老人列表API失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      },
      complete: function() {
        that.setData({
          loading: false
        });
      }
    });
  },

  // 选择老人变化
  onOldManChange(e) {
    var index = e.detail.value;
    var selectedOldMan = this.data.oldManList[index];
    
    this.setData({
      selectedOldMan: selectedOldMan,
      selectedIndex: index
    });
    
    // 保存当前选择的老人到全局数据
    app.globalData.currentOldMan = selectedOldMan;
    
    // 将选择状态保存到本地存储，确保页面重新加载时不会丢失
    wx.setStorageSync('selectedOldManId', selectedOldMan.id);
  },

  // 跳转到绑定老人页面
  openBindModal() {
    wx.navigateTo({
      url: '/pages/main/family/bind-old-man/bind-old-man'
    });
  },

  // 跳转到功能页面
  navigateToFunction(e) {
    var path = e.currentTarget.dataset.path;
    wx.navigateTo({
      url: path
    });
  }
});