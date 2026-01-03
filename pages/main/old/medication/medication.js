// medication.js
var app = getApp()
Page({
  data: {
    // 用药计划数据
    medicationPlans: [],
    // 分页参数
    pageNum: 1,
    pageSize: 10,
    total: 0,
    // 是否有更多数据
    hasMore: true,
    // 加载状态
    loading: false,
    // 用户ID（实际项目中应该从登录信息或全局状态获取）
    userId: 104
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 加载用药计划数据
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    var userId = userInfo.userId || userInfo.id || userInfo.customerId || 0;
    
    this.setData({
      userId: userId
    });
    
    this.loadMedicationPlans();
  },

  /**
   * 加载用药计划数据
   */
  loadMedicationPlans: function() {
    if (this.data.loading || !this.data.hasMore) return;
    
    var pageNum = this.data.pageNum;
    var pageSize = this.data.pageSize;
    var userId = this.data.userId;
    var that = this;
    
    this.setData({
      loading: true
    });
    
    // 构建查询参数
    var queryParams = {
      pageNum: pageNum,
      pageSize: pageSize,
      userId: userId
    };
    var token = wx.getStorageSync('token')
    
    // 调用后端API
    wx.request({
      url: app.globalData.baseUrl + '/medication/plans/list',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token // 携带token
      },
      data: queryParams,
      success: function(res) {
        console.log('获取用药计划列表成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          var rows = res.data.rows || [];
          var total = res.data.total || 0;
          // 合并数据
          var updatedPlans = [];
          for (var i = 0; i < that.data.medicationPlans.length; i++) {
            updatedPlans.push(that.data.medicationPlans[i]);
          }
          for (var j = 0; j < rows.length; j++) {
            updatedPlans.push(rows[j]);
          }
          that.setData({
            medicationPlans: updatedPlans,
            total: total,
            hasMore: rows.length === pageSize,
            pageNum: pageNum + 1
          });
        } else {
          console.error('获取用药计划列表失败:', res.data.message);
          wx.showToast({
            title: '获取用药计划失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        console.error('请求用药计划API失败:', err);
        wx.showToast({
          title: '网络请求失败',
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

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.setData({
      pageNum: 1,
      medicationPlans: [],
      hasMore: true
    });
    this.loadMedicationPlans();
    wx.stopPullDownRefresh();
  },

  /**
   * 上拉加载更多
   */
  onReachBottom: function() {
    this.loadMedicationPlans();
  },

  // 返回首页
  navigateBack: function() {
    wx.navigateBack({
      delta: 1
    });
  }
});