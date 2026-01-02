// pages/calendar/calendar.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentYear: 2025,
    currentMonth: 12
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化当前日期
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
    this.updateCalendarTitle();
  },

  /**
   * 更新日历标题
   */
  updateCalendarTitle() {
    const { currentYear, currentMonth } = this.data;
    this.setData({
      calendarTitle: `${currentYear}年${currentMonth}月`
    });
  },

  /**
   * 上月切换
   */
  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 1) {
      currentMonth = 12;
      currentYear--;
    } else {
      currentMonth--;
    }
    this.setData({
      currentYear,
      currentMonth
    });
    this.updateCalendarTitle();
  },

  /**
   * 下月切换
   */
  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 12) {
      currentMonth = 1;
      currentYear++;
    } else {
      currentMonth++;
    }
    this.setData({
      currentYear,
      currentMonth
    });
    this.updateCalendarTitle();
  },

  /**
   * 返回首页
   */
  navigateBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})