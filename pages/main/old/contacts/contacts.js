// contacts.js
var app = getApp()
Page({
  data: {
    // 控制联系人弹窗显示（新增/编辑共用）
    showContactModal: false,
    // 是否处于编辑模式
    isEditMode: false,
    // 联系人数据
    contacts: [],
    // 分页参数
    pageNum: 1,
    pageSize: 10,
    total: 0,
    // 是否有更多数据
    hasMore: true,
    // 加载状态
    loading: false,
    // 老人ID（实际项目中应该从登录信息或全局状态获取）
    customerId: 104,
    // 联系人表单数据
    newContact: {
      id: null,
      name: '',
      phone: '',
      remark: '',
      isDefault: '0'
    }
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 加载联系人数据
    var token = wx.getStorageSync('token');
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    var userId = userInfo.userId || userInfo.id || userInfo.customerId || 0;
    
    this.setData({
      customerId: userId // 使用正确的用户ID作为customerId
    });
    
    console.log('页面加载 - 用户ID:', userId);
    this.loadContacts();
  },

  /**
   * 加载联系人数据
   */
  loadContacts: function() {
    console.log(this.customerId)
    if (this.data.loading || !this.data.hasMore) return;
    
    var pageNum = this.data.pageNum;
    var pageSize = this.data.pageSize;
    var customerId = this.data.customerId;
    var that = this;
    
    this.setData({
      loading: true
    });
    
    // 构建查询参数
    var queryParams = {
      pageNum: pageNum,
      pageSize: pageSize,
      customerId: customerId
    };
    var token = wx.getStorageSync('token')
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
        console.log('获取联系人列表成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          var rows = res.data.rows || [];
          var total = res.data.total || 0;
          // 处理数据，将isdefault转换为isDefault（如果存在），并确保是字符串类型
          var processedRows = [];
          for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var processedRow = {};
            for (var key in row) {
              if (row.hasOwnProperty(key)) {
                processedRow[key] = row[key];
              }
            }
            processedRow.isDefault = String(row.isDefault !== undefined ? row.isDefault : row.isdefault || '0');
            processedRows.push(processedRow);
          }
          // 合并数据 - 直接使用原始数据，包含contactsId
          var updatedContacts = [];
          for (var j = 0; j < that.data.contacts.length; j++) {
            updatedContacts.push(that.data.contacts[j]);
          }
          for (var k = 0; k < processedRows.length; k++) {
            updatedContacts.push(processedRows[k]);
          }
          that.setData({
            contacts: updatedContacts,
            total: total,
            hasMore: processedRows.length === pageSize,
            pageNum: pageNum + 1
          });
        } else {
          console.error('获取联系人列表失败:', res.data.message);
          wx.showToast({
            title: '获取联系人失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        console.error('请求联系人API失败:', err);
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

  // 显示新增联系人弹窗
  showAddContactModal: function() {
    this.setData({
      showContactModal: true,
      isEditMode: false,
      newContact: {
        id: null,
        name: '',
        phone: '',
        remark: '',
        isDefault: '0'
      }
    });
  },
  
  // 显示编辑联系人弹窗
  showEditContactModal: function(e) {
    var contact = e.currentTarget.dataset.contact;
    console.log('显示编辑弹窗 - 联系人数据:', contact);
    
    this.setData({
      showContactModal: true,
      isEditMode: true,
      newContact: {
        id: contact.contactsId, // 直接使用contactsId
        contactsId: contact.contactsId, // 同时保留contactsId
        name: contact.name,
        phone: contact.phone,
        remark: contact.remark || '',
        isDefault: contact.isDefault !== undefined ? String(contact.isDefault) : '0'
      }
    });
  },
  
  // 隐藏联系人弹窗
  hideContactModal: function() {
    this.setData({
      showContactModal: false
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
  
  // 处理单选按钮变化
  handleRadioChange: function(e) {
    var value = e.detail.value; // 保持字符串类型
    this.setData({
      'newContact.isDefault': value
    });
  },
  
  // 保存联系人（新增/编辑）
  saveContact: function() {
    var newContact = this.data.newContact;
    var isEditMode = this.data.isEditMode;
    var that = this;
    
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
    
    // 获取token
    var token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '登录状态已过期',
        icon: 'none'
      });
      return;
    }
    
    // 获取userInfo和userId
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    var userId = userInfo.userId || userInfo.id || userInfo.customerId || 0;
    
    // 构建请求数据
    var requestData = {
      isDefault: newContact.isDefault,
      name: newContact.name,
      phone: newContact.phone,
      remark: newContact.remark || '',
      userId: userId
    };
    
    // 检查紧急联系人数量限制
    if (newContact.isDefault === '1') {
      // 获取当前紧急联系人数量
      var emergencyCount = 0;
      var contacts = this.data.contacts;
      for (var i = 0; i < contacts.length; i++) {
        if (contacts[i].isDefault === '1') {
          emergencyCount++;
        }
      }
      
      // 如果是编辑模式，且当前联系人不是紧急联系人，则紧急联系人数量+1
      if (isEditMode && newContact.id) {
        var currentContact = null;
        for (var j = 0; j < contacts.length; j++) {
          if (contacts[j].contactsId === newContact.id) {
            currentContact = contacts[j];
            break;
          }
        }
        if (currentContact && currentContact.isDefault !== '1') {
          emergencyCount++;
        }
      }
      // 如果是新增模式，则紧急联系人数量+1
      else if (!isEditMode) {
        emergencyCount++;
      }
      
      // 如果紧急联系人数量超过2个，显示提示并返回
      if (emergencyCount > 2) {
        wx.hideLoading();
        wx.showToast({
          title: '最多只能设置两个紧急联系人',
          icon: 'none'
        });
        return;
      }
    }
    
    // 新增联系人
    if (!isEditMode) {
      // 调用后端API新增联系人
      wx.request({
        url: app.globalData.baseUrl + '/contacts/add',
        method: 'POST',
        header: {
          'content-type': 'application/json',
          'Authorization': 'Bearer ' + token // 携带token
        },
        data: requestData,
        success: function(res) {
          console.log('新增联系人成功:', res.data);
          
          if (res.data && res.data.code === 200) {
            wx.showToast({
              title: '联系人添加成功',
              icon: 'success'
            });
            
            // 重新加载联系人列表
            that.setData({
              showContactModal: false,
              pageNum: 1,
              contacts: [],
              hasMore: true
            });
            that.loadContacts();
          } else {
            console.error('新增联系人失败:', res.data.message);
            wx.showToast({
              title: res.data.message || '联系人添加失败',
              icon: 'none'
            });
          }
        },
        fail: function(err) {
          console.error('请求新增联系人API失败:', err);
          wx.showToast({
            title: '网络请求失败，请重试',
            icon: 'none'
          });
        },
        complete: function() {
          wx.hideLoading();
        }
      });
    } else {
      // 编辑现有联系人 - 使用PUT请求
      console.log('编辑联系人 - 完整数据:', newContact);
      
      var editRequestData = {};
      for (var key in requestData) {
        if (requestData.hasOwnProperty(key)) {
          editRequestData[key] = requestData[key];
        }
      }
      editRequestData.contactsId = newContact.contactsId || newContact.id; // 优先使用contactsId
      
      console.log('编辑请求数据:', editRequestData);
      
      wx.request({
        url: app.globalData.baseUrl + '/contacts/update',
        method: 'PUT',
        header: {
          'content-type': 'application/json',
          'Authorization': 'Bearer ' + token // 携带token
        },
        data: editRequestData,
        success: function(res) {
          console.log('更新联系人成功:', res.data);
          
          if (res.data && res.data.code === 200) {
            wx.showToast({
              title: '联系人更新成功',
              icon: 'success'
            });
            
            // 重新加载联系人列表
            that.setData({
              showContactModal: false,
              pageNum: 1,
              contacts: [],
              hasMore: true
            });
            that.loadContacts();
          } else {
            console.error('更新联系人失败:', res.data.message);
            wx.showToast({
              title: res.data.message || '联系人更新失败',
              icon: 'none'
            });
          }
        },
        fail: function(err) {
          console.error('请求更新联系人API失败:', err);
          wx.showToast({
            title: '网络请求失败，请重试',
            icon: 'none'
          });
        },
        complete: function() {
          wx.hideLoading();
        }
      });
    }
  },
  
  // 删除联系人
  deleteContact: function(e) {
    var contact = e.currentTarget.dataset.contact;
    var contactId = contact.contactsId;
    var that = this;
    
    console.log('删除联系人 - 完整数据:', contact);
    console.log('删除联系人 - contactsId:', contactId);
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个联系人吗？',
      confirmText: '删除',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          // 获取token
          var token = wx.getStorageSync('token');
          if (!token) {
            wx.showToast({
              title: '登录状态已过期',
              icon: 'none'
            });
            return;
          }
          
          // 显示加载提示
          wx.showLoading({
            title: '删除中...',
            mask: true
          });
          
          console.log('删除联系人 - ID:', contactId);
          
          // 调用后端API删除联系人
          wx.request({
            url: app.globalData.baseUrl + '/contacts/delete/' + contactId,
            method: 'DELETE',
            header: {
              'content-type': 'application/json',
              'Authorization': 'Bearer ' + token // 携带token
            },
            success: function(res) {
              console.log('删除联系人成功:', res.data);
              
              if (res.data && res.data.code === 200) {
                wx.showToast({
                  title: '联系人删除成功',
                  icon: 'success'
                });
                
                // 重新加载联系人列表
                that.setData({
                  pageNum: 1,
                  contacts: [],
                  hasMore: true
                });
                that.loadContacts();
              } else {
                console.error('删除联系人失败:', res.data.message);
                wx.showToast({
                  title: res.data.message || '联系人删除失败',
                  icon: 'none'
                });
              }
            },
            fail: function(err) {
              console.error('请求删除联系人API失败:', err);
              wx.showToast({
                title: '网络请求失败，请重试',
                icon: 'none'
              });
            },
            complete: function() {
              wx.hideLoading();
            }
          });
        }
      }
    });
  },
  
  // 切换紧急联系人状态
  toggleEmergency: function(e) {
    var contact = e.currentTarget.dataset.contact;
    var contactsId = contact.contactsId;
    var currentIsDefault = contact.isDefault;
    var newIsDefault = currentIsDefault === '1' ? '0' : '1';
    var that = this;
    
    console.log('切换紧急联系人状态 - 联系人数据:', contact);
    console.log('联系人contactsId:', contactsId);
    console.log('当前isDefault:', currentIsDefault, '新isDefault:', newIsDefault);
    
    // 获取当前紧急联系人数量
    var emergencyCount = 0;
    var contacts = this.data.contacts;
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].isDefault === '1') {
        emergencyCount++;
      }
    }
    console.log('当前紧急联系人数量:', emergencyCount);
    
    // 如果是要设置为紧急联系人，且已有两个紧急联系人
    if (newIsDefault === '1' && emergencyCount >= 2) {
      wx.showToast({
        title: '最多只能设置两个紧急联系人',
        icon: 'none'
      });
      return;
    }
    
    // 获取token
    var token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '登录状态已过期',
        icon: 'none'
      });
      return;
    }
    
    console.log('找到联系人:', contact);
    
    // 显示加载提示
    wx.showLoading({
      title: '更新中...',
      mask: true
    });
    
    // 构建请求数据
    var requestData = {
      contactsId: contactsId,
      isDefault: newIsDefault,
      name: contact.name,
      phone: contact.phone,
      remark: contact.remark || '',
      userId: this.data.customerId
    };
    
    console.log('切换紧急联系人请求数据:', requestData);
    
    // 调用后端API更新紧急联系人状态
    wx.request({
      url: app.globalData.baseUrl + '/contacts/update',
      method: 'PUT',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token // 携带token
      },
      data: requestData,
      success: function(res) {
        console.log('更新紧急联系人状态成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          var toastTitle = newIsDefault === '1' ? '已设为紧急联系人' : '已取消紧急联系人';
          wx.showToast({
            title: toastTitle,
            icon: 'success'
          });
          
          // 重新加载联系人列表
          that.setData({
            pageNum: 1,
            contacts: [],
            hasMore: true
          });
          that.loadContacts();
        } else {
          console.error('更新紧急联系人状态失败:', res.data.message);
          wx.showToast({
            title: res.data.message || '更新失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        console.error('请求更新紧急联系人API失败:', err);
        wx.showToast({
          title: '网络请求失败，请重试',
          icon: 'none'
        });
      },
      complete: function() {
        wx.hideLoading();
      }
    });
  }
});