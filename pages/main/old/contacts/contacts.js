// contacts.js
const app = getApp()
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
      isDefault: 0
    }
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 加载联系人数据
    this.customerId = wx.getStorageSync('token')
    this.loadContacts();
  },

  /**
   * 加载联系人数据
   */
  loadContacts() {
    console.log(this.customerId)
    if (this.data.loading || !this.data.hasMore) return;
    
    const { pageNum, pageSize, customerId } = this.data;
    
    this.setData({
      loading: true
    });
    
    // 构建查询参数
    const queryParams = {
      pageNum,
      pageSize,
      customerId
    };
    const token = wx.getStorageSync('token')
    // 调用后端API
    wx.request({
      url: app.globalData.baseUrl+'/contacts/list',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token // 携带token
      },
      data: queryParams,
      success: (res) => {
        console.log('获取联系人列表成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          const { rows, total } = res.data;
          // 合并数据
          this.setData({
            contacts: [...this.data.contacts, ...rows],
            total,
            hasMore: rows.length === pageSize,
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
      fail: (err) => {
        console.error('请求联系人API失败:', err);
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

  // 显示新增联系人弹窗
  showAddContactModal() {
    this.setData({
      showContactModal: true,
      isEditMode: false,
      newContact: {
        id: null,
        name: '',
        phone: '',
        remark: '',
        isDefault: 0
      }
    });
  },
  
  // 显示编辑联系人弹窗
  showEditContactModal(e) {
    const contact = e.currentTarget.dataset.contact;
    this.setData({
      showContactModal: true,
      isEditMode: true,
      newContact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        remark: contact.remark || '',
        isDefault: contact.isDefault || 0
      }
    });
  },
  
  // 隐藏联系人弹窗
  hideContactModal() {
    this.setData({
      showContactModal: false
    });
  },
  
  // 处理表单输入变化
  handleInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`newContact.${field}`]: value
    });
  },
  
  // 处理单选按钮变化
  handleRadioChange(e) {
    const value = parseInt(e.currentTarget.dataset.value);
    this.setData({
      'newContact.isDefault': value
    });
  },
  
  // 保存联系人（新增/编辑）
  saveContact() {
    const { newContact, contacts, isEditMode } = this.data;
    
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
    
    // 构建联系人对象
    const contactToSave = {
      ...newContact,
      customerId: this.customerId
    };
    
    // 调用后端API保存联系人（这里先模拟前端操作，实际需要调用API）
    let updatedContacts;
    if (isEditMode) {
      // 编辑现有联系人
      updatedContacts = contacts.map(contact => 
        contact.id === newContact.id ? contactToSave : contact
      );
      wx.showToast({
        title: '联系人更新成功',
        icon: 'success'
      });
    } else {
      // 新增联系人
      contactToSave.id = Math.max(...contacts.map(contact => contact.id || 0), 0) + 1;
      updatedContacts = [...contacts, contactToSave];
      wx.showToast({
        title: '联系人添加成功',
        icon: 'success'
      });
    }
    
    // 更新联系人列表
    this.setData({
      contacts: updatedContacts,
      showContactModal: false
    });
  },
  
  // 删除联系人
  deleteContact(e) {
    const contactId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个联系人吗？',
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 调用后端API删除联系人（这里先模拟前端操作，实际需要调用API）
          const updatedContacts = this.data.contacts.filter(contact => contact.id !== contactId);
          this.setData({
            contacts: updatedContacts
          });
          wx.showToast({
            title: '联系人删除成功',
            icon: 'success'
          });
        }
      }
    });
  },
  
  // 切换紧急联系人状态
  toggleEmergency(e) {
    const contactId = e.currentTarget.dataset.id;
    const currentIsDefault = parseInt(e.currentTarget.dataset.isdefault);
    const newIsDefault = currentIsDefault === 1 ? 0 : 1;
    
    // 调用后端API更新紧急联系人状态（这里先模拟前端操作，实际需要调用API）
    const updatedContacts = this.data.contacts.map(contact => {
      if (contact.id === contactId) {
        return { ...contact, isDefault: newIsDefault };
      }
      return contact;
    });
    
    this.setData({
      contacts: updatedContacts
    });
    
    wx.showToast({
      title: newIsDefault === 1 ? '已设为紧急联系人' : '已取消紧急联系人',
      icon: 'success'
    });
  },

  }
});