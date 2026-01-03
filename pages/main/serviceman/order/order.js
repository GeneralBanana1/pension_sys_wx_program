// order.js - 服务人员订单管理
Page({
  data: {
    // 订单数据
    orders: [],
    // 是否可以返回
    canBack: false,
    // 是否还有更多数据
    hasMore: true,
    // 加载状态
    loading: false,
    // 分页参数
    pageNum: 1,
    pageSize: 10,
    // 订单状态筛选：null表示不筛选，0待接单，1已派单，2执行中，3已结束
    state: null
  },

  // 页面加载
  onLoad() {
    // 检查是否可以返回
    const pages = getCurrentPages();
    this.setData({
      canBack: pages.length > 1
    });
    
    // 获取订单列表
    this.getOrderList();
  },
  
  // 显示页面时刷新数据
  onShow() {
    this.getOrderList();
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

  // 获取订单列表
  getOrderList() {
    // 检查是否正在加载或没有更多数据
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    const app = getApp();
    const token = app.globalData.token || wx.getStorageSync('token');
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    
    // 先检查登录状态和用户信息是否存在
    if (!app.globalData.isLoggedIn || !userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      this.setData({ loading: false });
      return;
    }
    
    const { pageNum, pageSize, state } = this.data;
    
    // 构建请求参数，确保state要么为null要么为状态值，不会传递undefined
    const requestData = {
      pageNum: pageNum,
      pageSize: pageSize
    };
    
    // 只有当state不是null时才添加到请求参数中
    // 这样当state为null时，不会在URL中传递state参数
    if (state !== null) {
      requestData.state = state;
    }
    
    wx.request({
      url: app.globalData.baseUrl + '/service/order/list',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: requestData,
      success: (res) => {
        if (res.data && res.data.code === 200) {
          const newOrders = this.formatOrders(res.data.rows || []);
          const allOrders = pageNum === 1 ? newOrders : [...this.data.orders, ...newOrders];
          
          this.setData({
            orders: allOrders,
            hasMore: newOrders.length === pageSize, // 如果返回的数据长度小于pageSize，说明没有更多了
            pageNum: pageNum + 1 // 页码+1
          });
        } else {
          wx.showToast({
            title: res.data && res.data.msg || '加载失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络异常',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 下拉触底加载更多
  onReachBottom() {
    this.getOrderList();
  },
  
  // 格式化订单数据
  formatOrders(orders) {
    const statusMap = {
      '0': '待接单',
      '1': '已派单', 
      '2': '执行中',
      '3': '已完成',
      '4': '已取消'
    };
    
    const typeMap = {
      '0': '护工服务',
      '1': '维修服务'
    };
    
    return orders.map(order => {
      // 兼容不同的字段名
      const orderId = order.orderId || order.id || order.order_num;
      const state = order.state || order.status || '0';
      const type = order.type || '1';
      
      let statusClass = 'status-pending';
      const actions = [];
      
      switch(state) {
        case '0': // 待接单
          statusClass = 'status-pending';
          actions.push({ text: '接单', type: 'accept', class: 'accept' });
          break;
        case '1': // 已派单
          statusClass = 'status-processing';
          actions.push({ text: '开始服务', type: 'start', class: 'start' });
          actions.push({ text: '联系老人', type: 'contact', class: 'contact' });
          break;
        case '2': // 执行中
          statusClass = 'status-processing';
          actions.push({ text: '完成服务', type: 'complete', class: 'complete' });
          actions.push({ text: '联系老人', type: 'contact', class: 'contact' });
          break;
        case '3': // 已完成
          statusClass = 'status-completed';
          break;
        case '4': // 已取消
          statusClass = 'status-canceled';
          break;
      }
      
      return {
        orderId: orderId,
        orderNum: order.orderNum || order.order_id || orderId,
        serviceType: typeMap[type] || '维修服务',
        status: statusMap[state] || '未知状态',
        statusClass: statusClass,
        description: order.details || order.detail || '无描述',
        createTime: order.createTime || order.create_time || '',
        // 服务时间
        serviceTime: order.time || order.service_time || '',
        // 备注
        remark: order.remark || '',
        actions: actions,
        // 老人信息
        customerName: order.customerName || order.customer || order.oldName || '老人',
        // 老人ID
        customerId: order.customerId || '',
        // 老人电话 - 兼容API返回的phonenumber字段
        customerPhone: order.customerPhone || order.phonenumber || order.phone || order.mobile || '',
        // 服务地址
        serviceAddress: order.address || order.serviceAddress || '',
        state: state,
        type: type
      };
    });
  },
  
  // 处理订单操作
  handleOrderAction(e) {
    const { orderid, actiontype } = e.currentTarget.dataset;
    const order = this.data.orders.find(item => item.orderId == orderid);
    
    if (!order) {
      wx.showToast({
        title: '订单不存在',
        icon: 'none'
      });
      return;
    }
    
    switch(actiontype) {
      case 'accept':
        this.acceptOrder(order.orderId);
        break;
        
      case 'start':
        this.startService(order.orderId);
        break;
        
      case 'complete':
        this.completeService(order.orderId);
        break;
        
      case 'contact':
        if (order.customerPhone) {
          wx.makePhoneCall({
            phoneNumber: order.customerPhone
          });
        } else {
          wx.showToast({
            title: '老人电话暂未提供',
            icon: 'none'
          });
        }
        break;
    }
  },
  
  // 接单
  acceptOrder(orderId) {
    wx.showModal({
      title: '确认接单',
      content: '确定要接受这个服务订单吗？',
      confirmText: '接单',
      confirmColor: '#07C160',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus(orderId, '1', '接单成功');
        }
      }
    });
  },
  
  // 开始服务
  startService(orderId) {
    wx.showModal({
      title: '确认开始服务',
      content: '确定要开始这个服务订单吗？',
      confirmText: '开始服务',
      confirmColor: '#07C160',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus(orderId, '2', '开始服务成功');
        }
      }
    });
  },
  
  // 完成服务
  completeService(orderId) {
    wx.showModal({
      title: '确认完成服务',
      content: '确定要结束这个服务订单吗？',
      confirmText: '完成服务',
      confirmColor: '#07C160',
      success: (res) => {
        if (res.confirm) {
          this.updateOrderStatus(orderId, '3', '服务完成成功');
        }
      }
    });
  },
  
  // 更新订单状态
  updateOrderStatus(orderId, newStatus, successMsg) {
    wx.showLoading({
      title: '处理中...',
      mask: true
    });
    
    const app = getApp();
    const token = app.globalData.token || wx.getStorageSync('token');
    
    wx.request({
      url: app.globalData.baseUrl + '/service/order/updateState',
      method: 'PUT',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: {
        orderId: orderId,
        state: newStatus
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.data && res.data.code === 200) {
          wx.showToast({
            title: successMsg,
            icon: 'success'
          });
          
          // 强制刷新订单列表：重置分页参数并重新调用查询接口
          this.setData({
            pageNum: 1, // 重置页码为1
            hasMore: true // 重置为有更多数据
          });
          
          // 刷新订单列表
          setTimeout(() => {
            this.getOrderList();
          }, 1000);
        } else {
          wx.showToast({
            title: res.data.msg || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('更新订单状态失败：', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 加载更多
  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.getOrderList();
    }
  },
  
  // 返回上一页
  navigateBack() {
    wx.navigateBack();
  }
});