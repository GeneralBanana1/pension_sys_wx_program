// pages/weather/weather.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    location: { latitude: 0, longitude: 0 },
    locationName: '',
    weatherData: {
      temp: '--',
      text: '未知',
      windDir: '--',
      windScale: '--',
      humidity: '--',
      pressure: '--',
      visibility: '--',
      uvIndex: '--'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.getUserLocation();
  },

  /**
   * 获取用户位置
   */
  getUserLocation: function() {
    var that = this;
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        var latitude = res.latitude;
        var longitude = res.longitude;
        that.setData({
          location: { latitude: latitude, longitude: longitude }
        });
        // 获取到位置后调用天气API
        that.getWeatherData(latitude, longitude);
      },
      fail: function(err) {
        console.error('获取位置失败:', err);
        wx.showToast({
          title: '无法获取位置',
          icon: 'none'
        });
        that.setData({
          loading: false
        });
      }
    });
  },

  /**
   * 调用腾讯位置服务天气API获取天气数据
   */
  getWeatherData(latitude, longitude) {
    const that = this;
    const key = 'XIQBZ-FUHYZ-5E4XL-7USZE-SQIN2-ATB4Q';
    
    // 根据腾讯位置服务天气API文档，使用正确的API地址和参数
    const url = `https://apis.map.qq.com/ws/weather/v1/?key=${key}&location=${latitude},${longitude}&type=now`;
    
    console.log('请求天气API的URL:', url);
    console.log('请求参数:', { key, location: `${latitude},${longitude}`, type: 'now' });
    
    wx.request({
      url: url,
      method: 'GET',
      success(res) {
        console.log('API返回状态码:', res.statusCode);
        console.log('API返回完整数据:', res.data);
        
        if (res.data.status === 0) {
          console.log('API请求成功，开始解析数据');
          that.parseWeatherData(res.data);
        } else {
          console.error('获取天气数据失败，状态码:', res.data.status);
          console.error('错误信息:', res.data.message || res.data);
          wx.showToast({
            title: '无法获取天气数据',
            icon: 'none'
          });
          // 为了测试，使用模拟数据
          that.setMockWeatherData();
        }
      },
      fail(err) {
        console.error('网络请求失败:', err.errMsg);
        console.error('失败详情:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        // 为了测试，使用模拟数据
        that.setMockWeatherData();
      },
      complete() {
        that.setData({
          loading: false
        });
      }
    });
  },

  /**
   * 解析天气数据
   */
  parseWeatherData(data) {
    console.log('开始解析天气数据:', data);
    
    let weatherInfo = {};
    
    // 检查数据结构
    if (!data) {
      console.error('无效的天气数据: 数据为空');
      this.setMockWeatherData();
      return;
    }
    
    if (!data.result) {
      console.error('无效的天气数据格式: 缺少result字段');
      this.setMockWeatherData();
      return;
    }
    
    const result = data.result;
    console.log('result字段数据:', result);
    
    // 根据API实际返回数据结构，realtime是一个数组
    if (result.realtime && Array.isArray(result.realtime) && result.realtime.length > 0) {
      const realtimeItem = result.realtime[0];
      console.log('realtime数组第一个元素:', realtimeItem);
      
      // 提取基本位置信息
      if (realtimeItem.city) {
        console.log('城市信息:', realtimeItem.city);
        console.log('地区信息:', realtimeItem.district);
        // 将城市和地区信息组合成完整位置名称
        const fullLocation = realtimeItem.district ? `${realtimeItem.city}${realtimeItem.district}` : realtimeItem.city;
        this.setData({
          locationName: fullLocation
        });
      }
      
      // 提取天气信息
      if (realtimeItem.infos) {
        const infos = realtimeItem.infos;
        console.log('infos字段数据:', infos);
        
        weatherInfo.temp = infos.temperature || '--';
        weatherInfo.text = infos.weather || '未知';
        weatherInfo.windDir = infos.wind_direction || '--';
        weatherInfo.windScale = infos.wind_power || '--';
        weatherInfo.humidity = infos.humidity || '--';
        weatherInfo.pressure = infos.air_pressure || '--';
        weatherInfo.visibility = '--'; // API不直接提供能见度数据
        weatherInfo.uvIndex = '--'; // API不直接提供紫外线指数数据
        
        console.log('提取的天气信息:', weatherInfo);
        
        // 更新UI数据
        this.setData({
          weatherData: weatherInfo
        });
      } else {
        console.error('缺少infos字段');
        this.setMockWeatherData();
        return;
      }
    } else {
      console.error('realtime字段不是有效的数组或为空');
      this.setMockWeatherData();
      return;
    }
  },

  /**
   * 设置模拟天气数据（用于测试）
   */
  setMockWeatherData() {
    this.setData({
      locationName: '北京市',
      weatherData: {
        temp: '22',
        text: '晴天',
        windDir: '南风',
        windScale: '3',
        humidity: '45',
        pressure: '1013',
        visibility: '10',
        uvIndex: '中等'
      }
    });
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
    this.setData({
      loading: true
    });
    this.getUserLocation();
    wx.stopPullDownRefresh();
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
