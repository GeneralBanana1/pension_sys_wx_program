// medication.js
Page({
  data: {
    // 用药提醒数据
    medications: [
      { time: '08:00', name: '降压药', dosage: '1片', frequency: '每日一次', taken: false },
      { time: '12:00', name: '维生素C', dosage: '2片', frequency: '每日一次', taken: false },
      { time: '18:00', name: '钙片', dosage: '1片', frequency: '每日一次', taken: false },
      { time: '21:00', name: '助眠药', dosage: '1片', frequency: '睡前服用', taken: false }
    ]
  },

  // 标记为已服用
  markAsTaken(e) {
    const index = e.currentTarget.dataset.index;
    const medications = this.data.medications;
    medications[index].taken = true;
    
    this.setData({
      medications: medications
    });
    
    wx.showToast({
      title: '已标记为已服用',
      icon: 'success'
    });
  },

  // 返回首页
  navigateBack() {
    wx.navigateBack({
      delta: 1
    });
  }
});