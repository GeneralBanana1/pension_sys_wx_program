// index.js
var app = getApp();
Page({
  data: {
    // 用户名
    userName: '',
    // 当前日期
    currentDate: '',
    // 紧急联系人电话
    emergencyContact: [],
    // 当前时间
    currentTime: '',
    // 控制联系人弹窗显示
    showContactModal: false,
    // 控制新增联系人弹窗显示
    showAddContactModal: false,
    // 控制用药提醒弹窗显示
    showMedicationModal: false,
    // 控制天气弹窗显示
    showWeatherModal: false,
    // 天气相关数据
    weatherData: {},
    // 定位相关数据
    location: {
      latitude: '',
      longitude: ''
    },
    // 联系人数据
    // 用药提醒数据
    medications: [
      { time: '08:00', name: '降压药', dosage: '1片', frequency: '每日一次' },
      { time: '12:00', name: '维生素C', dosage: '2片', frequency: '每日一次' },
      { time: '18:00', name: '钙片', dosage: '1片', frequency: '每日一次' },
      { time: '21:00', name: '助眠药', dosage: '1片', frequency: '睡前服用' }
    ],
  },

  // 页面加载时初始化当前时间
  onLoad: function() {
    // 初始化用户名
    var userInfo = wx.getStorageSync('userInfo') || {};
    var userName = userInfo.userName || userInfo.name || '老人家';
    
    // 初始化当前日期
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    var currentDate = year + '年' + month + '月' + day + '日 星期' + weekday;
    
    // 更新数据
    this.setData({
      userName: userName,
      currentDate: currentDate
    });
    
    // 更新当前时间
    this.updateCurrentTime();
    // 设置定时器，每秒更新时间
    var that = this;
    this.timeInterval = setInterval(function() {
      that.updateCurrentTime();
    }, 1000);
    
    // 首先从本地存储读取紧急联系人数据
    var cachedContacts = wx.getStorageSync('emergencyContact') || [];
    if (cachedContacts.length > 0) {
      this.setData({
        emergencyContact: cachedContacts
      });
    }
    
    // 然后加载最新的紧急联系人数据
    this.loadContacts();
  },

  // 更新当前时间
  updateCurrentTime: function() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    // 补零函数
    var padZero = function(num) {
      return num < 10 ? '0' + num : num;
    };
    var timeStr = padZero(hours) + ':' + padZero(minutes);
    this.setData({
      currentTime: timeStr
    });
  },

  // 页面卸载时清除定时器
  onUnload: function() {
    if (this.timeInterval) {
      this.loadContacts();
      clearInterval(this.timeInterval);
    }
  },
  
  // 页面显示时更新tabBar
  onShow: function() {
    this.updateTabBar();
  },
  
  // 更新自定义tabBar
  updateTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setTabList();
      this.getTabBar().updateActiveIndex();
    }
  },
  /**
   * 加载联系人数据
   */
  loadContacts: function() {
    // 从本地存储获取老人ID
    var customerId = wx.getStorageSync('customerId') || '';
    
    var queryParams = {
      pageNum:"1",
      pageSize:"2",
      customerId:104,
      isDefault: "1"
    };
    var token = wx.getStorageSync('token');
    var that = this;
    // 调用后端API
    wx.request({
      url: app.globalData.baseUrl+'/contacts/list',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token // 携带token
      },
      data: queryParams,
      success: function(res) {
        console.log('获取紧急联系人列表成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          var rows = res.data.rows || [];
          // 更新紧急联系人数据
          var updatedContacts = rows;
          that.setData({
            emergencyContact: updatedContacts
          });
          
          // 将最新的紧急联系人数据保存到本地存储
          wx.setStorageSync('emergencyContact', updatedContacts);
          console.log('紧急联系人数据已缓存到本地');
        } else {
          console.error('获取紧急联系人列表失败:', res.data.message);
          wx.showToast({
            title: '获取紧急联系人列表失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        console.error('获取紧急联系人列表API失败:', err);
        
        // 检查本地是否有缓存的联系人数据
        var cachedContacts = wx.getStorageSync('emergencyContact') || [];
        if (cachedContacts.length > 0) {
          console.log('使用本地缓存的紧急联系人数据');
          that.setData({
            emergencyContact: cachedContacts
          });
          wx.showToast({
            title: '使用缓存的联系人数据',
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: '网络请求失败，无缓存数据',
            icon: 'none'
          });
        }
      },
      complete: function() {
        that.setData({
          loading: false
        });
      }
    });
  },

  // 一键应急 - 紧急呼叫
  makeEmergencyCall: function() {
    var emergencyContact = this.data.emergencyContact;
    
    // 检查紧急联系人数据是否存在
    if (!emergencyContact || emergencyContact.length === 0 || !emergencyContact[0] || !emergencyContact[0].phone) {
      wx.showToast({
        title: '未绑定紧急联系人号码，请联系子女远程操作',
        icon: 'none'
      });
      return;
    }
    
    var that = this;
    wx.showModal({
      title: '紧急呼叫',
      content: '确定要拨打紧急联系人电话 ' + emergencyContact[0].phone + ' 吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          // 使用wx.makePhoneCall拨打电话
          wx.makePhoneCall({
            phoneNumber: emergencyContact[0].phone,
            success: function() {
              console.log('紧急呼叫成功');
            },
            fail: function(err) {
              console.error('紧急呼叫失败:', err);
              wx.showToast({
                title: '呼叫失败，请重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 长按事件 - 防误触
  onLongPress: function() {
    console.log('长按事件触发');
  },

  // 一键求助
  sendHelpRequest: function() {
    wx.navigateTo({
      url: '/pages/main/old/help/help'
    });
  },
  


  // 拨打联系人电话
  callContact: function(e) {
    var phoneNumber = e.currentTarget.dataset.phone;
    var that = this;
    wx.showModal({
      title: '拨打电话',
      content: '确定要拨打 ' + phoneNumber + ' 吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: phoneNumber,
            success: function() {
              console.log('拨打电话成功');
            },
            fail: function(err) {
              console.error('拨打电话失败:', err);
              wx.showToast({
                title: '呼叫失败，请重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },
  
  // 显示联系人弹窗
  showContactModal: function() {
    wx.navigateTo({
      url: '/pages/main/old/contacts/contacts'
    });
  },
  
  // 隐藏联系人弹窗
  hideContactModal: function() {
    this.setData({
      showContactModal: false
    });
  },
  
  // 显示新增联系人弹窗
  showAddContactModal: function() {
    this.setData({
      showAddContactModal: true
    });
  },
  
  // 隐藏新增联系人弹窗
  hideAddContactModal: function() {
    this.setData({
      showAddContactModal: false,
      newContact: {
        name: '',
        phone: '',
        note: ''
      }
    });
  },
  
  // 处理表单输入变化
  handleInputChange: function(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    var newData = {};
    newData['newContact.' + field] = value;
    this.setData(newData);
  },
  
  // 新增联系人
  addContact: function() {
    var newContact = this.data.newContact;
    var contacts = this.data.contacts || [];
    
    // 表单验证
    if (!newContact.name) {
      wx.showToast({
        title: '请输入联系人姓名',
        icon: 'none'
      });
      return;
    }
    
    if (!newContact.phone) {
      wx.showToast({
        title: '请输入电话号码',
        icon: 'none'
      });
      return;
    }
    
    // 创建新联系人
    var maxId = 0;
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].id > maxId) {
        maxId = contacts[i].id;
      }
    }
    var newId = maxId + 1;
    var avatar = newContact.name.charAt(0);
    var contactToAdd = {
      id: newId,
      name: newContact.name,
      phone: newContact.phone,
      avatar: avatar,
      note: newContact.note
    };
    
    // 添加到联系人列表
    var updatedContacts = [];
    for (var j = 0; j < contacts.length; j++) {
      updatedContacts.push(contacts[j]);
    }
    updatedContacts.push(contactToAdd);
    this.setData({
      contacts: updatedContacts,
      showAddContactModal: false,
      newContact: {
        name: '',
        phone: '',
        note: ''
      }
    });
    
    wx.showToast({
      title: '联系人添加成功',
      icon: 'success'
    });
  },

  // 显示用药提醒弹窗
  showMedicationReminder: function() {
    wx.navigateTo({
      url: '/pages/main/old/medication/medication'
    });
  },

  // 隐藏用药提醒弹窗
  hideMedicationModal: function() {
    this.setData({
      showMedicationModal: false
    });
  },

  // 显示天气信息
  showWeather: function() {
    wx.navigateTo({
      url: '/pages/main/old/weather/weather'
    });
  },
  
  // 显示日历
  showCalendar: function() {
    wx.navigateTo({
      url: '/pages/main/old/calendar/calendar'
    });
  },
  
  // 显示订单列表
  showOrderList: function() {
    wx.navigateTo({
      url: '/pages/main/old/orders/orders'
    });
  },
  



  
  // 获取天气数据
  getWeatherData: function(latitude, longitude) {
    var that = this;
    // 使用腾讯天气API获取天气数据
    var key = 'XIQBZ-FUHYZ-5E4XL-7USZE-SQIN2-ATB4Q';
    
    wx.request({
      url: 'https://apis.map.qq.com/ws/weather/v1/?location=' + latitude + ',' + longitude + '&key=' + key,
      success: function(res) {
        wx.hideLoading();
        if (res.data.status === 0) {
          // 根据实际返回的JSON结构解析天气数据
          var realtime = res.data.result.realtime || [];
          if (realtime.length > 0) {
            var realtimeData = realtime[0];
            var infos = realtimeData.infos || {};
            var weatherData = {
              temp: infos.temperature !== undefined ? infos.temperature : '--',
              text: infos.weather || '未知',
              windDir: infos.wind_direction || '--',
              windScale: infos.wind_power || '--',
              humidity: infos.humidity !== undefined ? infos.humidity : '--'
            };
            that.setData({
              weatherData: weatherData
            });
            // 显示天气弹窗
            that.setData({
              showWeatherModal: true
            });
          } else {
            console.error('实时天气数据为空');
            wx.showToast({
              title: '获取天气数据失败',
              icon: 'none'
            });
          }
        } else {
          console.error('获取天气数据失败:', res.data);
          wx.showToast({
            title: '获取天气数据失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        wx.hideLoading();
        console.error('请求天气API失败:', err);
        wx.showToast({
          title: '网络请求失败，请检查网络连接',
          icon: 'none'
        });
      }
    });
  },
  
  // 隐藏天气弹窗
  hideWeatherModal: function() {
    this.setData({
      showWeatherModal: false
    });
  },
  


  // 导航到个人页面
  navigateToPersonal: function() {
    wx.navigateTo({
      url: '/pages/main/old/personal/personal'
    });
  }
});
