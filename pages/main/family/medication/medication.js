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
    // 用户ID
    userId: 0,
    // 用药计划弹窗显示状态
    showModal: false,
    // 编辑模式标识
    isEditMode: false,
    // 当前编辑的用药计划ID
    editingPlanId: null,
    // 用药计划表单数据
    formData: {
      drugName: '',
      nickName: '',
      dosage: '',
      frequency: '',
      remark: '',
      isActive: '1'
    },
    // 新增用药记录弹窗显示状态
    showRecordModal: false,
    // 编辑用药记录弹窗显示状态
    showEditRecordModal: false,
    // 当前选择的用药计划ID（用于新增记录）
    selectedPlanId: null,
    // 当前编辑的用药记录数据
    editingRecord: null,
    // 当前编辑的用药记录表单数据
    editRecordForm: {
      date: '',
      time: '',
      remark: ''
    },
    // 新增用药记录表单数据
    recordForm: {
      date: '',
      time: '',
      remark: ''
    },
    // 用药记录展开状态，存储每个计划的展开状态
    expandedPlans: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 加载用药计划数据
    var selectedOldMan = app.globalData.currentOldMan;
    if (selectedOldMan && selectedOldMan.id) {
      this.setData({
        userId: selectedOldMan.id
      });
      this.loadMedicationPlans();
    } else {
      wx.showToast({
        title: '请先选择老人',
        icon: 'none'
      });
      setTimeout(function() {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 加载用药计划数据
   */
  loadMedicationPlans: function() {
    if (this.data.loading || !this.data.hasMore) return;
    
    var that = this;
    var pageNum = this.data.pageNum;
    var pageSize = this.data.pageSize;
    var userId = this.data.userId;
    
    this.setData({
      loading: true
    });
    
    // 构建查询参数
    var queryParams = {
      pageNum: pageNum,
      pageSize: pageSize,
      userId: userId
    };
    var token = wx.getStorageSync('token');
    
    // 调用后端API
    wx.request({
      url: app.globalData.baseUrl + '/medication/plans/list',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: queryParams,
      success: function(res) {
        console.log('获取用药计划列表成功:', res.data);
        
        if (res.data && res.data.code === 200) {
          var rows = res.data.rows || [];
          var total = res.data.total || 0;
          // 合并数据
          var newMedicationPlans = that.data.medicationPlans.concat(rows);
          that.setData({
            medicationPlans: newMedicationPlans,
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
  },

  // 显示编辑弹窗
  showEditModal: function(e) {
    var planId = e.currentTarget.dataset.planid;
    var plan = null;
    for (var i = 0; i < this.data.medicationPlans.length; i++) {
      if (this.data.medicationPlans[i].medicationPlansId === planId) {
        plan = this.data.medicationPlans[i];
        break;
      }
    }

    if (plan) {
      this.setData({
        showModal: true,
        isEditMode: true,
        editingPlanId: planId,
        formData: {
          drugName: plan.drugName || '',
          nickName: plan.nickName || '',
          dosage: plan.dosage || '',
          frequency: plan.frequency || '',
          remark: plan.remark || '',
          isActive: plan.isActive || '1'
        }
      });
    }
  },

  // 显示添加弹窗
  showAddModal: function() {
    this.setData({
      showModal: true,
      isEditMode: false,
      editingPlanId: null,
      formData: {
        drugName: '',
        nickName: '',
        dosage: '',
        frequency: '',
        remark: '',
        isActive: '1'
      }
    });
  },

  // 关闭弹窗
  closeModal: function() {
    this.setData({
      showModal: false
    });
  },

  // 表单输入变化
  onInputChange: function(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    var formData = this.data.formData;
    formData[field] = value;
    this.setData({
      formData: formData
    });
  },

  // 状态选择变化
  onStatusChange: function(e) {
    var value = e.detail.value;
    var formData = this.data.formData;
    formData.isActive = value === 0 ? '1' : '0';
    this.setData({
      formData: formData
    });
  },

  // 提交表单
  submitForm: function() {
    var that = this;
    var formData = this.data.formData;
    var isEditMode = this.data.isEditMode;
    var editingPlanId = this.data.editingPlanId;
    var userId = this.data.userId;

    // 表单验证
    if (!formData.drugName.trim()) {
      wx.showToast({
        title: '请输入药品名称',
        icon: 'none'
      });
      return;
    }

    if (!formData.dosage.trim()) {
      wx.showToast({
        title: '请输入剂量',
        icon: 'none'
      });
      return;
    }

    if (!formData.frequency.trim()) {
      wx.showToast({
        title: '请输入服用频率',
        icon: 'none'
      });
      return;
    }

    // 构建请求数据
    var requestData = {
      drugName: formData.drugName,
      nickName: formData.nickName,
      dosage: formData.dosage,
      frequency: formData.frequency,
      remark: formData.remark,
      isActive: formData.isActive,
      userId: userId
    };

    if (isEditMode) {
      requestData.medicationPlansId = editingPlanId;
    }

    var token = wx.getStorageSync('token');
    var url = app.globalData.baseUrl + (isEditMode ? '/medication/plans/update' : '/medication/plans/create');
    var method = isEditMode ? 'PUT' : 'POST';

    wx.showLoading({
      title: isEditMode ? '更新中...' : '添加中...',
      mask: true
    });

    wx.request({
      url: url,
      method: method,
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: requestData,
      success: function(res) {
        wx.hideLoading();
        if (res.data && res.data.code === 200) {
          wx.showToast({
            title: isEditMode ? '更新成功' : '添加成功',
            icon: 'success'
          });
          that.closeModal();
          // 刷新列表
          that.refreshList();
        } else {
          wx.showToast({
            title: res.data.msg || (isEditMode ? '更新失败' : '添加失败'),
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        wx.hideLoading();
        console.error('请求失败:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  // 删除用药计划
  deletePlan: function(e) {
    var that = this;
    var planId = e.currentTarget.dataset.planid;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个用药计划吗？',
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: function(res) {
        if (res.confirm) {
          var token = wx.getStorageSync('token');
          
          wx.showLoading({
            title: '删除中...',
            mask: true
          });

          wx.request({
            url: app.globalData.baseUrl + '/medication/plans/delete/' + planId,
            method: 'PUT',
            header: {
              'content-type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            success: function(res) {
              wx.hideLoading();
              if (res.data && res.data.code === 200) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                // 刷新列表
                that.refreshList();
              } else {
                wx.showToast({
                  title: res.data.msg || '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: function(err) {
              wx.hideLoading();
              console.error('删除失败:', err);
              wx.showToast({
                title: '网络请求失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 刷新列表
  refreshList: function() {
    this.setData({
      pageNum: 1,
      medicationPlans: [],
      hasMore: true
    });
    this.loadMedicationPlans();
  },
  
  // 显示新增用药记录弹窗
  showAddRecordModal: function(e) {
    var planId = e.currentTarget.dataset.planid;
    // 初始化表单数据
    var now = new Date();
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString().padStart(2, '0');
    var day = now.getDate().toString().padStart(2, '0');
    var hours = now.getHours().toString().padStart(2, '0');
    var minutes = now.getMinutes().toString().padStart(2, '0');
    
    var currentDate = year + '-' + month + '-' + day;
    var currentTime = hours + ':' + minutes;
    
    this.setData({
      showRecordModal: true,
      selectedPlanId: planId,
      recordForm: {
        date: currentDate,
        time: currentTime,
        remark: ''
      }
    });
  },
  
  // 关闭新增用药记录弹窗
  closeRecordModal: function() {
    this.setData({
      showRecordModal: false,
      selectedPlanId: null
    });
  },
  
  // 处理用药日期选择
  bindRecordDateChange: function(e) {
    var date = e.detail.value;
    this.setData({
      recordForm: {
        date: date,
        time: this.data.recordForm.time,
        remark: this.data.recordForm.remark
      }
    });
  },
  
  // 处理用药时间选择
  bindRecordTimeChange: function(e) {
    var time = e.detail.value;
    this.setData({
      recordForm: {
        date: this.data.recordForm.date,
        time: time,
        remark: this.data.recordForm.remark
      }
    });
  },
  
  // 处理备注输入
  onRecordRemarkChange: function(e) {
    var remark = e.detail.value;
    this.setData({
      recordForm: {
        date: this.data.recordForm.date,
        time: this.data.recordForm.time,
        remark: remark
      }
    });
  },
  
  // 提交用药记录
  submitRecord: function() {
    var that = this;
    var planId = this.data.selectedPlanId;
    var recordForm = this.data.recordForm;
    
    // 表单验证
    if (!recordForm.date || !recordForm.time) {
      wx.showToast({
        title: '请选择完整的服用时间',
        icon: 'none'
      });
      return;
    }
    
    // 构建请求数据，合并日期和时间
    var requestData = {
      medicationPlansId: planId,
      remark: recordForm.remark,
      time: recordForm.date + ' ' + recordForm.time + ':00' // 格式：YYYY-MM-DD HH:mm:ss
    };
    
    var token = wx.getStorageSync('token');
    var url = app.globalData.baseUrl + '/medication/records/create';
    
    wx.showLoading({
      title: '提交中...',
      mask: true
    });
    
    wx.request({
      url: url,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: requestData,
      success: function(res) {
        wx.hideLoading();
        if (res.data && res.data.code === 200) {
          wx.showToast({
            title: '提交成功',
            icon: 'success'
          });
          that.closeRecordModal();
          // 刷新列表
          that.refreshList();
        } else {
          wx.showToast({
            title: res.data.msg || '提交失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        wx.hideLoading();
        console.error('请求失败:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  // 显示编辑用药记录弹窗
  showEditRecordModal: function(e) {
    var planId = e.currentTarget.dataset.planid;
    var record = e.currentTarget.dataset.record;
    
    // 解析时间字符串，分离日期和时间
    var timeStr = record.time;
    var date = timeStr.substring(0, 10);
    var time = timeStr.substring(11, 16);
    
    this.setData({
      showEditRecordModal: true,
      editingRecord: {
        medicationPlansId: planId,
        medicationRecordId: record.medicationRecordId
      },
      editRecordForm: {
        date: date,
        time: time,
        remark: record.remark || ''
      }
    });
  },
  
  // 关闭编辑用药记录弹窗
  closeEditRecordModal: function() {
    this.setData({
      showEditRecordModal: false,
      editingRecord: null
    });
  },
  
  // 处理编辑记录的日期选择
  bindEditRecordDateChange: function(e) {
    var date = e.detail.value;
    this.setData({
      editRecordForm: {
        date: date,
        time: this.data.editRecordForm.time,
        remark: this.data.editRecordForm.remark
      }
    });
  },
  
  // 处理编辑记录的时间选择
  bindEditRecordTimeChange: function(e) {
    var time = e.detail.value;
    this.setData({
      editRecordForm: {
        date: this.data.editRecordForm.date,
        time: time,
        remark: this.data.editRecordForm.remark
      }
    });
  },
  
  // 处理编辑记录的备注输入
  onEditRecordRemarkChange: function(e) {
    var remark = e.detail.value;
    this.setData({
      editRecordForm: {
        date: this.data.editRecordForm.date,
        time: this.data.editRecordForm.time,
        remark: remark
      }
    });
  },
  
  // 提交编辑用药记录
  submitEditRecord: function() {
    var that = this;
    var editingRecord = this.data.editingRecord;
    var editRecordForm = this.data.editRecordForm;
    
    // 表单验证
    if (!editRecordForm.date || !editRecordForm.time) {
      wx.showToast({
        title: '请选择完整的服用时间',
        icon: 'none'
      });
      return;
    }
    
    // 构建请求数据
    var requestData = {
      medicationPlansId: editingRecord.medicationPlansId,
      medicationRecordId: editingRecord.medicationRecordId,
      remark: editRecordForm.remark,
      time: editRecordForm.date + ' ' + editRecordForm.time + ':00' // 格式：YYYY-MM-DD HH:mm:ss
    };
    
    var token = wx.getStorageSync('token');
    var url = app.globalData.baseUrl + '/medication/records/update';
    
    wx.showLoading({
      title: '更新中...',
      mask: true
    });
    
    wx.request({
      url: url,
      method: 'PUT',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: requestData,
      success: function(res) {
        wx.hideLoading();
        if (res.data && res.data.code === 200) {
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          });
          that.closeEditRecordModal();
          // 刷新列表
          that.refreshList();
        } else {
          wx.showToast({
            title: res.data.msg || '更新失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        wx.hideLoading();
        console.error('请求失败:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 删除用药记录
  deleteRecord: function(e) {
    var that = this;
    var recordId = e.currentTarget.dataset.recordid;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个用药记录吗？',
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: function(res) {
        if (res.confirm) {
          var token = wx.getStorageSync('token');
          
          wx.showLoading({
            title: '删除中...',
            mask: true
          });
          
          wx.request({
            url: app.globalData.baseUrl + '/medication/records/delete/' + recordId,
            method: 'PUT',
            header: {
              'content-type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            success: function(res) {
              wx.hideLoading();
              if (res.data && res.data.code === 200) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                // 刷新列表
                that.refreshList();
              } else {
                wx.showToast({
                  title: res.data.msg || '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: function(err) {
              wx.hideLoading();
              console.error('删除失败:', err);
              wx.showToast({
                title: '网络请求失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 切换用药记录展开/收起状态
  togglePlanRecords: function(e) {
    var planId = e.currentTarget.dataset.planid;
    var expandedPlans = this.data.expandedPlans;
    
    // 切换展开状态，如果未定义则默认为展开
    expandedPlans[planId] = !expandedPlans[planId];
    
    this.setData({
      expandedPlans: expandedPlans
    });
  }
});