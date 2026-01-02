// medication.js
const app = getApp()
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
  onLoad(options) {
    // 加载用药计划数据
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    const userId = userInfo.userId || userInfo.id || userInfo.customerId || 0;
    
    this.setData({
      userId: userId
    });
    
    this.loadMedicationPlans();
  },

  /**
   * 加载用药计划数据
   */
  loadMedicationPlans() {
    if (this.data.loading || !this.data.hasMore) return;
    
    const { pageNum, pageSize, userId } = this.data;
    
    this.setData({
      loading: true
    });
    
    // 构建查询参数
    const queryParams = {
      pageNum,
      pageSize,
      userId
    };
    const token = wx.getStorageSync('token')
    
    // 调用后端API
    wx.request({
      url: app.globalData.baseUrl + '/medication/plans/list',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token // 携带token
      },
      data: queryParams,
      success: (res) => {
        console.log('获取用药计划列表成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          const { rows, total } = res.data;
          // 合并数据
          this.setData({
            medicationPlans: [...this.data.medicationPlans, ...rows],
            total,
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
      fail: (err) => {
        console.error('请求用药计划API失败:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({
          loading: false
        });
      }
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
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
  onReachBottom() {
    this.loadMedicationPlans();
  },

  // 返回首页
  navigateBack() {
    wx.navigateBack({
      delta: 1
    });
  }
});