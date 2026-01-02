// schedule.js
Page({
  data: {
    // 当前日期
    currentDate: '',
    // 今日安排数据
    todaySchedule: [
      {
        time: '09:00',
        service: '上门体检',
        nurse: '张护士'
      },
      {
        time: '14:00',
        service: '康复训练',
        nurse: '李护士'
      },
      {
        time: '16:00',
        service: '心理疏导',
        nurse: '王医生'
      },
      {
        time: '19:00',
        service: '晚餐配送',
        nurse: '陈阿姨'
      }
    ]
  },

  onLoad() {
    // 获取当前日期
    this.updateCurrentDate();
  },

  // 更新当前日期
  updateCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    
    const dateStr = `${year}年${month}月${day}日 ${weekday}`;
    this.setData({
      currentDate: dateStr
    });
  },

  // 返回首页
  navigateBack() {
    wx.navigateBack({
      delta: 1
    });
  }
});