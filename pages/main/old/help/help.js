// help.js - 面向老年人的优化版
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
    // 服务时间 - 初始为空
    serviceTime: '',
    // 日期选择器数据
    date: '',
    // 时间选择器数据
    time: '',
    // 时间选择器起始时间 - 小程序picker组件需要YYYY-MM-DD HH:mm格式
    startTime: '',
    // 弹窗显示状态
    showModal: false,
    // 编辑模式标识
    isEditMode: false,
    // 当前编辑的订单ID
    editingOrderId: null,
    // 重新发起时的原订单ID
    reinitiateOrderId: null,
    // 时间选择器显示状态
    showTimePicker: false,
    // 订单数据
    orders: [],
    // 是否可以返回
    canBack: false,
    // 是否还有更多数据
    hasMore: true,
    // 是否显示服务类型选择器
    showServicePicker: false,
    // 加载状态
    loading: false,
    // 分页参数
    pageNum: 1,
    pageSize: 10
  },

  // 页面加载
  onLoad: function() {
    // 检查是否可以返回
    var pages = getCurrentPages();
    
    // 获取当前日期和时间
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
    var day = now.getDate();
    day = day < 10 ? '0' + day : day;
    var hour = now.getHours();
    hour = hour < 10 ? '0' + hour : hour;
    var minute = now.getMinutes();
    minute = minute < 10 ? '0' + minute : minute;
    
    this.setData({
      canBack: pages.length > 1,
      // 时间选择器起始时间 - 小程序picker组件需要YYYY-MM-DD HH:mm格式
      startTime: year + '-' + month + '-' + day + ' ' + hour + ':' + minute,
      // 日期选择器起始时间 - 格式为YYYY-MM-DD
      startDate: year + '-' + month + '-' + day
    });
    
    // 获取订单列表
    this.getOrderList();
  },
  
  // 页面显示时刷新数据
  onShow: function() {
    this.getOrderList();
  },

  // 获取订单列表
  getOrderList: function() {
    // 检查是否正在加载或没有更多数据
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    var that = this;
    var app = getApp();
    var token = app.globalData.token || wx.getStorageSync('token');
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    
    // 先检查登录状态和用户信息是否存在
    if (!app.globalData.isLoggedIn || !userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      that.setData({ loading: false });
      return;
    }
    
    var customerId = userInfo.customerId || userInfo.id || userInfo.userId;
    var pageNum = this.data.pageNum;
    var pageSize = this.data.pageSize;
    
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
          var newOrders = that.formatOrders(res.data.rows || []);
          var allOrders = [];
          if (pageNum === 1) {
            allOrders = newOrders;
          } else {
            allOrders = [];
            for (var i = 0; i < that.data.orders.length; i++) {
              allOrders.push(that.data.orders[i]);
            }
            for (var j = 0; j < newOrders.length; j++) {
              allOrders.push(newOrders[j]);
            }
          }
          
          that.setData({
            orders: allOrders,
            hasMore: newOrders.length === pageSize, // 如果返回的数据长度小于pageSize，说明没有更多了
            pageNum: pageNum + 1 // 页码+1
          });
        } else {
          wx.showToast({
            title: res.data && res.data.msg ? res.data.msg : '加载失败',
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

  // 下拉触底加载更多
  onReachBottom: function() {
    this.getOrderList();
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
      // 兼容不同的字段名
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
        // 服务时间
        serviceTime: order.time || order.service_time || '',
        // 备注
        remark: order.remark || '',
        actions: actions,
        servicePerson: order.service || order.service_person || '',
        // 兼容不同的字段名
        phoneNumber: order.phonenumber || order.phone || order.mobile || order.telephone || '',
        state: state,
        type: type
      });
    }
    return formattedOrders;
  },
  
  // 格式化时间显示
  formatTime: function(timeStr) {
    if (!timeStr) return '';
    var time = new Date(timeStr);
    var now = new Date();
    var diff = now - time;
    var dayDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    var hours = time.getHours();
    hours = hours < 10 ? '0' + hours : hours;
    var minutes = time.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    if (dayDiff === 0) {
      return '今天 ' + hours + ':' + minutes;
    } else if (dayDiff === 1) {
      return '昨天 ' + hours + ':' + minutes;
    } else {
      return (time.getMonth() + 1) + '月' + time.getDate() + '日 ' + hours + ':' + minutes;
    }
  },

  // 显示发单弹窗
  showOrderModal: function() {
    this.setData({ showModal: true });
  },

  // 关闭发单弹窗
  closeOrderModal: function() {
    // 重置表单
    this.resetForm();
    this.setData({ 
      showModal: false,
      showServicePicker: false
    });
  },

  // 显示服务类型选择器
  showServiceTypePicker: function() {
    this.setData({ showServicePicker: true });
  },
  
  // 隐藏服务类型选择器
  hideServiceTypePicker: function() {
    this.setData({ showServicePicker: false });
  },

  // 服务类型选择变化
  onServiceTypeChange: function(e) {
    this.setData({
      selectedServiceIndex: e.detail.value,
      showServicePicker: false
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

  // 显示时间选择器
  showTimePicker: function() {
    this.setData({
      showTimePicker: true
    });
  },

  // 隐藏时间选择器
  hideTimePicker: function() {
    this.setData({
      showTimePicker: false
    });
  },

  // 时间选择器变化事件
  onPickerViewChange: function(e) {
    var that = this;
    var value = e.detail.value;
    var yearArray = this.data.yearArray || [];
    var monthArray = this.data.monthArray || [];
    var dayArray = this.data.dayArray || [];
    var hourArray = this.data.hourArray || [];
    var minuteArray = this.data.minuteArray || [];
    
    // 获取当前选中的各值
    var selectedYear = yearArray[value[0]];
    var selectedMonth = monthArray[value[1]];
    var selectedHour = hourArray[value[3]];
    var selectedMinute = minuteArray[value[4]];
    
    // 如果月份变化，需要重新计算天数
    if (selectedMonth !== this.data.currentMonth) {
      var newDayArray = that.getDaysInMonth(selectedYear, selectedMonth);
      // 确保当前天数不超过新月份的天数，使用新数组的长度作为上限
      var selectedDay = dayArray[value[2]] || 1;
      if (selectedDay > newDayArray.length) {
        selectedDay = newDayArray.length;
      }
      
      that.setData({
        dayArray: newDayArray,
        currentYear: selectedYear,
        currentMonth: selectedMonth,
        currentDay: selectedDay,
        currentHour: selectedHour,
        currentMinute: selectedMinute
      });
    } else {
      // 月份不变，直接使用选中的天数
      var selectedDay = dayArray[value[2]];
      
      that.setData({
        currentYear: selectedYear,
        currentMonth: selectedMonth,
        currentDay: selectedDay,
        currentHour: selectedHour,
        currentMinute: selectedMinute
      });
    }
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
    
    var selectedIndex = 0;
    var serviceTypes = this.data.serviceTypes;
    for (var i = 0; i < serviceTypes.length; i++) {
      if (serviceTypes[i] === order.serviceType) {
        selectedIndex = i;
        break;
      }
    }
    
    // 填充表单数据
    this.setData({
      showModal: true,
      isEditMode: true,
      editingOrderId: order.orderId,
      selectedServiceIndex: selectedIndex,
      orderDescription: order.description,
      remark: order.remark,
      serviceTime: order.serviceTime,
      date: date,
      time: time
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
      editingOrderId: null
    });
  },

  // 日期选择变化事件
  bindDateChange: function(e) {
    var value = e.detail.value;
    this.setData({
      date: value
    });
    
    // 更新服务时间
    this.updateServiceTime();
  },
  
  // 时间选择变化事件
  bindTimeChange: function(e) {
    var value = e.detail.value;
    this.setData({
      time: value
    });
    
    // 更新服务时间
    this.updateServiceTime();
  },
  
  // 更新组合的服务时间
  updateServiceTime: function() {
    var date = this.data.date;
    var time = this.data.time;
    
    if (date && time) {
      // 组合日期和时间，格式为YYYY-MM-DD HH:mm
      var formattedTime = date + ' ' + time;
      this.setData({
        serviceTime: formattedTime
      });
    } else {
      // 如果日期或时间未选择，清空服务时间
      this.setData({
        serviceTime: ''
      });
    }
  },
  
  // 提交订单（创建或更新）
  submitOrder: function() {
    var that = this;
    var orderDescription = this.data.orderDescription;
    var serviceTypes = this.data.serviceTypes;
    var selectedServiceIndex = this.data.selectedServiceIndex;
    var serviceTime = this.data.serviceTime;
    var remark = this.data.remark;
    var isEditMode = this.data.isEditMode;
    var editingOrderId = this.data.editingOrderId;
    
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
      if (!isNaN(date.getTime())) {
        // 转换为ISO 8601格式（带T）
        formattedTime = date.toISOString().substring(0, 19);
      } else {
        wx.showToast({
          title: '时间格式错误，请使用YYYY-MM-DD HH:mm格式',
          icon: 'none',
          duration: 2000
        });
        return;
      }
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
    
    var customerId = userInfo.customerId || userInfo.id || userInfo.userId;
    
    // 服务类型直接使用索引作为类型值
    // 0=护工服务，1=维修服务
    var orderType = selectedServiceIndex.toString();
    
    // 构建请求参数
    var requestData = {
      customerId: customerId,
      details: orderDescription.trim(),
      remark: remark.trim(), // 备注信息
      time: formattedTime, // 格式化后的服务时间，Java后端可处理
      type: orderType // 映射后的订单类型
    };
    
    // 如果是编辑模式，添加orderId参数
    if (isEditMode) {
      requestData.orderId = editingOrderId;
    }
    
    var toastTitle = isEditMode ? '更新中...' : '提交中...';
    wx.showLoading({
      title: toastTitle,
      mask: true
    });
    
    // 调用真实的API接口
    var url = isEditMode ? app.globalData.baseUrl + '/user/order/update' : app.globalData.baseUrl + '/user/order/create';
    var method = isEditMode ? 'PUT' : 'POST';
    
    wx.request({
      url: url,
      method: method,
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: requestData,
      success: function(res) {
        console.log(isEditMode ? '更新订单响应：' : '提交订单响应：', res);
        
        if (res.data && res.data.code === 200) {
          var successToastTitle = isEditMode ? '订单已更新' : '服务请求已提交';
            wx.showToast({
              title: successToastTitle,
              icon: 'success',
              duration: 2000
            });
            
            // 保存原订单ID
            var reinitiateOrderId = that.data.reinitiateOrderId;
            
            // 重置表单
            that.resetForm();
            that.setData({
              showModal: false,
              reinitiateOrderId: null // 清空重新发起订单ID
            });
            
            // 如果是重新发起订单，提交成功后自动删除原订单
            if (reinitiateOrderId) {
              wx.showLoading({ title: '删除原订单中...' });
              
              var app = getApp();
              var token = app.globalData.token || wx.getStorageSync('token');
              
              // 调用删除原订单接口
              wx.request({
                url: app.globalData.baseUrl + '/user/order/delete/' + reinitiateOrderId,
                method: 'PUT',
                header: {
                  'content-type': 'application/json',
                  'Authorization': 'Bearer ' + token
                },
                success: function(deleteRes) {
                  wx.hideLoading();
                  
                  if (deleteRes.data && deleteRes.data.code === 200) {
                    console.log('原订单删除成功');
                  } else {
                    console.error('原订单删除失败：', deleteRes.data.msg || '删除失败');
                  }
                  
                  // 强制刷新订单列表：重置分页参数并重新调用查询接口
                  that.setData({
                    pageNum: 1, // 重置页码为1
                    hasMore: true // 重置为有更多数据
                  });
                  
                  // 刷新订单列表
                  setTimeout(function() {
                    that.getOrderList();
                  }, 500);
                },
                fail: function(err) {
                  wx.hideLoading();
                  console.error('原订单删除失败：', err);
                  
                  // 即使删除失败，也要刷新订单列表
                  that.setData({
                    pageNum: 1,
                    hasMore: true
                  });
                  
                  setTimeout(function() {
                    that.getOrderList();
                  }, 500);
                }
              });
            } else {
              // 不是重新发起订单，直接刷新订单列表
              that.setData({
                pageNum: 1,
                hasMore: true
              });
              
              setTimeout(function() {
                that.getOrderList();
              }, 1000);
            }
          } else {
            var errorToastTitle = res.data.msg || (isEditMode ? '更新失败' : '提交失败');
            wx.showToast({
              title: errorToastTitle,
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

  // 处理订单操作
  handleOrderAction: function(e) {
    var orderid = e.currentTarget.dataset.orderid;
    var actiontype = e.currentTarget.dataset.actiontype;
    var orders = this.data.orders;
    var order = null;
    
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].orderId == orderid) {
        order = orders[i];
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
    
    var that = this;
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
        var selectedIndex = 0;
        var serviceTypes = this.data.serviceTypes;
        for (var j = 0; j < serviceTypes.length; j++) {
          if (serviceTypes[j] === order.serviceType) {
            selectedIndex = j;
            break;
          }
        }
        
        this.setData({
          showModal: true,
          selectedServiceIndex: selectedIndex,
          // 保存原订单ID
          reinitiateOrderId: order.orderId
        });
        break;
        
      case 'edit':
        this.editOrder(order);
        break;
        
      case 'delete':
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
        
      case 'view':
        wx.navigateTo({
          url: '/pages/orderDetail/orderDetail?orderId=' + order.orderId
        });
        break;
    }
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
          wx.showLoading({ title: '处理中...' });
          
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
            data: {},
            success: function(res) {
              wx.hideLoading();
              
              if (res.data && res.data.code === 200) {
                wx.showToast({
                  title: '订单已取消',
                  icon: 'success'
                });
                
                // 强制刷新订单列表：重置分页参数并重新调用查询接口
                that.setData({
                  pageNum: 1, // 重置页码为1
                  hasMore: true // 重置为有更多数据
                });
                
                // 刷新订单列表
                setTimeout(function() {
                  that.getOrderList();
                }, 1000);
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
  
  // 删除订单
  deleteOrder: function(orderId) {
    var that = this;
    wx.showLoading({ title: '删除中...' });
    
    var app = getApp();
    var token = app.globalData.token || wx.getStorageSync('token');
    
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
          
          // 强制刷新订单列表：重置分页参数并重新调用查询接口
          that.setData({
            pageNum: 1, // 重置页码为1
            hasMore: true // 重置为有更多数据
          });
          
          // 刷新订单列表
          setTimeout(function() {
            that.getOrderList();
          }, 1000);
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
  },
  
  // 加载更多
  loadMore: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.getOrderList();
    }
  },
  
  // 返回上一页
  navigateBack: function() {
    wx.navigateBack();
  },
  
  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '居家服务',
      path: '/pages/help/help'
    };
  }
});