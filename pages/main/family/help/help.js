// help.js - 家属端服务请求页面
Page({
  data: {
    // 服务类型列表
    serviceTypes: ['护工服务', '维修服务'],
    // 选中的服务类型索引
    selectedServiceIndex: 0,
    // 订单描述
    orderDescription: '',
    // 备注信息
    remark: '',
    // 服务时间
    serviceTime: '',
    // 日期选择器数据
    date: '',
    // 时间选择器数据
    time: '',
    // 弹窗显示状态
    showModal: false,
    // 编辑模式标识
    isEditMode: false,
    // 当前编辑的订单ID
    editingOrderId: null,
    // 重新发起时的原订单ID
    reinitiateOrderId: null,
    // 订单数据
    orders: [],
    // 加载状态
    loading: false,
    // 分页参数
    pageNum: 1,
    pageSize: 10,
    // 是否有更多数据
    hasMore: true
  },

  // 页面加载
  onLoad: function(options) {
    var now = new Date();
    var year = now.getFullYear();
    var month = (now.getMonth() + 1) < 10 ? '0' + (now.getMonth() + 1) : (now.getMonth() + 1);
    var day = now.getDate() < 10 ? '0' + now.getDate() : now.getDate();
    var hour = now.getHours() < 10 ? '0' + now.getHours() : now.getHours();
    var minute = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
    
    this.setData({
      startTime: year + '-' + month + '-' + day + ' ' + hour + ':' + minute,
      startDate: year + '-' + month + '-' + day
    });
    
    // 获取订单列表
    this.getOrderList();
  },

  // 显示页面时刷新数据
  onShow: function() {
    this.getOrderList();
  },

  // 获取订单列表
  getOrderList: function() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    var app = getApp();
    var token = app.globalData.token || wx.getStorageSync('token');
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    
    // 先检查登录状态和用户信息是否存在
    if (!app.globalData.isLoggedIn || !userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      this.setData({ loading: false });
      return;
    }
    
    // 对于家属端，使用当前选择的老人ID作为customerId
    var selectedOldMan = app.globalData.currentOldMan;
    if (!selectedOldMan || !selectedOldMan.id) {
      wx.showToast({
        title: '请先选择老人',
        icon: 'none'
      });
      this.setData({ loading: false });
      return;
    }
    
    var customerId = selectedOldMan.id;
    var pageNum = this.data.pageNum;
    var pageSize = this.data.pageSize;
    
    var that = this;
    wx.request({
      url: app.globalData.baseUrl + '/user/order/list',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: {
        pageNum: pageNum,
        pageSize: pageSize,
        customerId: customerId
      },
      success: function(res) {
        if (res.data && res.data.code === 200) {
          var rows = res.data.rows || [];
          var total = res.data.total || 0;
          var newOrders = that.formatOrders(rows);
          var allOrders = pageNum === 1 ? newOrders : that.data.orders.concat(newOrders);
          
          that.setData({
            orders: allOrders,
            hasMore: newOrders.length === pageSize,
            pageNum: pageNum + 1
          });
        } else {
          wx.showToast({
            title: res.data && res.data.msg || '加载失败',
            icon: 'none'
          });
        }
      },
      fail: function() {
        wx.showToast({
          title: '网络异常',
          icon: 'none'
        });
      },
      complete: function() {
        that.setData({ loading: false });
      }
    });
  },

  // 格式化订单数据
  formatOrders: function(orders) {
    var statusMap = {
      '0': '待接单',
      '1': '已派单', 
      '2': '执行中',
      '3': '已完成',
      '4': '已取消'
    };
    
    var typeMap = {
      '0': '护工服务',
      '1': '维修服务'
    };
    
    var formattedOrders = [];
    for (var i = 0; i < orders.length; i++) {
      var order = orders[i];
      var orderId = order.orderId || order.id || order.order_num;
      var state = order.state || order.status || '0';
      var type = order.type || '1';
      
      var statusClass = 'status-pending';
      var actions = [];
      
      switch(state) {
        case '0': // 待接单
          statusClass = 'status-pending';
          actions.push({ text: '编辑订单', type: 'edit', class: 'edit' });
          actions.push({ text: '取消订单', type: 'cancel', class: 'cancel' });
          break;
        case '1': // 已派单
        case '2': // 执行中
          statusClass = 'status-processing';
          actions.push({ text: '联系师傅', type: 'contact', class: 'contact' });
          break;
        case '3': // 已完成
          statusClass = 'status-completed';
          actions.push({ text: '删除订单', type: 'delete', class: 'delete' });
          break;
        case '4': // 已取消
          statusClass = 'status-canceled';
          actions.push({ text: '重新发起', type: 'reinitiate', class: 'reinitiate' });
          actions.push({ text: '删除订单', type: 'delete', class: 'delete' });
          break;
      }
      
      formattedOrders.push({
        orderId: orderId,
        orderNum: order.orderNum || order.order_id || orderId,
        serviceType: typeMap[type] || '维修服务',
        status: statusMap[state] || '未知状态',
        statusClass: statusClass,
        description: order.details || order.detail || '无描述',
        createTime: order.createTime || order.create_time || '',
        serviceTime: order.time || order.service_time || '',
        remark: order.remark || '',
        actions: actions,
        servicePerson: order.service || order.service_person || '',
        phoneNumber: order.phonenumber || order.phone || order.mobile || order.telephone || '',
        state: state,
        type: type
      });
    }
    
    return formattedOrders;
  },

  // 下拉触底加载更多
  onReachBottom: function() {
    this.getOrderList();
  },

  // 显示发单弹窗
  showOrderModal: function() {
    this.setData({ showModal: true });
  },

  // 关闭发单弹窗
  closeOrderModal: function() {
    this.resetForm();
    this.setData({ 
      showModal: false
    });
  },
  
  // 重置表单
  resetForm: function() {
    this.setData({
      orderDescription: '',
      remark: '',
      serviceTime: '',
      date: '',
      time: '',
      selectedServiceIndex: 0,
      isEditMode: false,
      editingOrderId: null,
      reinitiateOrderId: null
    });
  },
  
  // 编辑订单
  editOrder: function(order) {
    // 解析服务时间为日期和时间
    var date = '';
    var time = '';
    if (order.serviceTime) {
      var timeParts = order.serviceTime.split(' ');
      date = timeParts[0];
      time = timeParts[1];
    }
    
    // 查找服务类型索引
    var serviceIndex = 0;
    for (var i = 0; i < this.data.serviceTypes.length; i++) {
      if (this.data.serviceTypes[i] === order.serviceType) {
        serviceIndex = i;
        break;
      }
    }
    
    // 填充表单数据
    this.setData({
      showModal: true,
      isEditMode: true,
      editingOrderId: order.orderId,
      selectedServiceIndex: serviceIndex,
      orderDescription: order.description,
      remark: order.remark,
      serviceTime: order.serviceTime,
      date: date,
      time: time
    });
  },

  // 服务类型选择变化
  onServiceTypeChange: function(e) {
    this.setData({
      selectedServiceIndex: e.detail.value
    });
  },

  // 订单描述输入变化
  onDescChange: function(e) {
    this.setData({
      orderDescription: e.detail.value
    });
  },

  // 备注输入变化
  onRemarkChange: function(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 日期选择变化事件
  bindDateChange: function(e) {
    this.setData({
      date: e.detail.value
    });
    this.updateServiceTime();
  },

  // 时间选择变化事件
  bindTimeChange: function(e) {
    this.setData({
      time: e.detail.value
    });
    this.updateServiceTime();
  },

  // 更新组合的服务时间
  updateServiceTime: function() {
    var date = this.data.date;
    var time = this.data.time;
    
    if (date && time) {
      var formattedTime = date + ' ' + time;
      this.setData({
        serviceTime: formattedTime
      });
    } else {
      this.setData({
        serviceTime: ''
      });
    }
  },

  // 提交订单（创建或更新）
  submitOrder: function() {
    var orderDescription = this.data.orderDescription;
    var serviceTime = this.data.serviceTime;
    var isEditMode = this.data.isEditMode;
    var editingOrderId = this.data.editingOrderId;
    var reinitiateOrderId = this.data.reinitiateOrderId;
    
    if (!orderDescription.trim()) {
      wx.showToast({
        title: '请描述您的需求',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    if (!serviceTime) {
      wx.showToast({
        title: '请选择服务时间',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 验证时间格式并转换为Java后端可处理的格式
    var formattedTime = serviceTime;
    var timeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    
    if (timeRegex.test(serviceTime)) {
      // 输入格式为YYYY-MM-DD HH:mm，转换为带T的ISO格式（如：2026-01-02T14:30:00）
      formattedTime = serviceTime.replace(' ', 'T') + ':00';
    } else {
      // 尝试解析并格式化
      var date = new Date(serviceTime);
      if (isNaN(date.getTime())) {
        wx.showToast({
          title: '时间格式错误，请使用YYYY-MM-DD HH:mm格式',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      // 转换为ISO 8601格式（带T）
      formattedTime = date.toISOString().substring(0, 19);
    }
    
    var app = getApp();
    var token = app.globalData.token || wx.getStorageSync('token');
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    
    // 先检查登录状态和用户信息是否存在
    if (!app.globalData.isLoggedIn || !userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    // 对于家属端，使用当前选择的老人ID作为customerId
    var selectedOldMan = app.globalData.currentOldMan;
    if (!selectedOldMan || !selectedOldMan.id) {
      wx.showToast({
        title: '请先选择老人',
        icon: 'none'
      });
      return;
    }
    
    var customerId = selectedOldMan.id;
    
    // 服务类型直接使用索引作为类型值
    // 0=护工服务，1=维修服务
    var orderType = this.data.selectedServiceIndex.toString();
    
    // 构建请求参数
    var requestData = {
      customerId: customerId,
      details: orderDescription.trim(),
      remark: this.data.remark.trim(),
      time: formattedTime,
      type: orderType
    };
    
    // 如果是编辑模式，添加orderId参数
    if (isEditMode) {
      requestData.orderId = editingOrderId;
    }
    
    var that = this;
    var url = isEditMode ? app.globalData.baseUrl + '/user/order/update' : app.globalData.baseUrl + '/user/order/create';
    var method = isEditMode ? 'PUT' : 'POST';
    
    wx.showLoading({
      title: isEditMode ? '更新中...' : '提交中...',
      mask: true
    });
    
    // 调用真实的API接口
    wx.request({
      url: url,
      method: method,
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: requestData,
      success: function(res) {
        if (res.data && res.data.code === 200) {
          wx.showToast({
            title: isEditMode ? '订单已更新' : '服务请求已提交',
            icon: 'success',
            duration: 2000
          });
          
          // 保存原订单ID
          var oldReinitiateOrderId = reinitiateOrderId;
          
          // 关闭弹窗并重置表单
          that.closeOrderModal();
          
          // 如果是重新发起订单，提交成功后自动删除原订单
          if (oldReinitiateOrderId) {
            wx.showLoading({ title: '删除原订单中...' });
            
            var app = getApp();
            var token = app.globalData.token || wx.getStorageSync('token');
            
            // 调用删除原订单接口
            wx.request({
              url: app.globalData.baseUrl + '/user/order/delete/' + oldReinitiateOrderId,
              method: 'PUT',
              header: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              success: function(deleteRes) {
                wx.hideLoading();
                
                // 刷新订单列表
                that.refreshOrderList();
              },
              fail: function(err) {
                wx.hideLoading();
                console.error('删除原订单失败：', err);
                
                // 即使删除失败，也要刷新订单列表
                that.refreshOrderList();
              }
            });
          } else {
            // 不是重新发起订单，直接刷新订单列表
            that.refreshOrderList();
          }
        } else {
          wx.showToast({
            title: res.data.msg || (isEditMode ? '更新失败' : '提交失败'),
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        console.error(isEditMode ? '更新订单失败：' : '提交订单失败：', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      },
      complete: function() {
        wx.hideLoading();
      }
    });
  },
  
  // 刷新订单列表
  refreshOrderList: function() {
    this.setData({
      pageNum: 1,
      hasMore: true
    });
    var that = this;
    setTimeout(function() {
      that.getOrderList();
    }, 1000);
  },

  // 取消订单
  cancelOrder: function(orderId) {
    var that = this;
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      confirmText: '取消订单',
      confirmColor: '#ff4d4f',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...', mask: true });
          
          var app = getApp();
          var token = app.globalData.token || wx.getStorageSync('token');
          
          // 调用真实的取消订单API接口
          wx.request({
            url: app.globalData.baseUrl + '/user/order/cancel/' + orderId,
            method: 'PUT',
            header: {
              'content-type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            success: function(res) {
              wx.hideLoading();
              
              if (res.data && res.data.code === 200) {
                wx.showToast({
                  title: '订单已取消',
                  icon: 'success'
                });
                
                // 刷新订单列表
                that.refreshOrderList();
              } else {
                wx.showToast({
                  title: res.data.msg || '取消失败',
                  icon: 'none'
                });
              }
            },
            fail: function(err) {
              console.error('取消订单失败：', err);
              wx.hideLoading();
              wx.showToast({
                title: '网络错误，请稍后重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 处理订单操作
  handleOrderAction: function(e) {
    var orderid = e.currentTarget.dataset.orderid;
    var actiontype = e.currentTarget.dataset.actiontype;
    
    // 查找订单
    var order = null;
    for (var i = 0; i < this.data.orders.length; i++) {
      if (this.data.orders[i].orderId === orderid) {
        order = this.data.orders[i];
        break;
      }
    }
    
    if (!order) {
      wx.showToast({
        title: '订单不存在',
        icon: 'none'
      });
      return;
    }
    
    switch(actiontype) {
      case 'cancel':
        this.cancelOrder(order.orderId);
        break;
        
      case 'contact':
        if (order.phoneNumber) {
          wx.makePhoneCall({
            phoneNumber: order.phoneNumber
          });
        } else {
          wx.showToast({
            title: '师傅电话暂未提供',
            icon: 'none'
          });
        }
        break;
        
      case 'reinitiate':
        // 查找服务类型索引
        var serviceIndex = 0;
        for (var i = 0; i < this.data.serviceTypes.length; i++) {
          if (this.data.serviceTypes[i] === order.serviceType) {
            serviceIndex = i;
            break;
          }
        }
        
        this.setData({
          showModal: true,
          selectedServiceIndex: serviceIndex,
          reinitiateOrderId: order.orderId
        });
        break;
        
      case 'edit':
        this.editOrder(order);
        break;
        
      case 'delete':
        var that = this;
        wx.showModal({
          title: '确认删除',
          content: '确定要删除这个订单吗？',
          confirmText: '删除',
          confirmColor: '#ff4d4f',
          success: function(res) {
            if (res.confirm) {
              that.deleteOrder(order.orderId);
            }
          }
        });
        break;
    }
  },
  
  // 删除订单
  deleteOrder: function(orderId) {
    var app = getApp();
    var token = app.globalData.token || wx.getStorageSync('token');
    
    var that = this;
    wx.showLoading({
      title: '删除中...',
      mask: true
    });
    
    // 调用真实的删除订单API接口
    wx.request({
      url: app.globalData.baseUrl + '/user/order/delete/' + orderId,
      method: 'PUT',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      success: function(res) {
        wx.hideLoading();
        
        if (res.data && res.data.code === 200) {
          wx.showToast({
            title: '订单已删除',
            icon: 'success'
          });
          
          // 刷新订单列表
          that.refreshOrderList();
        } else {
          wx.showToast({
            title: res.data.msg || '删除失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        console.error('删除订单失败：', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    });
  }
});