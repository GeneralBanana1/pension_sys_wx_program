const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loading: true, // 加载状态
    hasData: false, // 是否有数据
    healthData: [], // 原始健康数据
    // 各指标图表数据
    bloodPressureData: {
      labels: [],
      systolic: [],
      diastolic: []
    },
    heartRateData: {
      labels: [],
      values: []
    },
    bloodOxygenData: {
      labels: [],
      values: []
    },
    bodyTemperatureData: {
      labels: [],
      values: []
    },
    fastingBloodSugarData: {
      labels: [],
      values: []
    },
    bloodSugar2hAfterMealData: {
      labels: [],
      values: []
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadHealthData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 页面渲染完成后绘制图表
    this.drawCharts();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadHealthData();
  },

  /**
   * 加载健康数据
   */
  loadHealthData() {
    this.setData({ loading: true });
    // 获取用户ID
    const userId = app.globalData.userInfo?.id;
    const token=app.globalData.token || wx.getStorageSync('token');
    
    console.log('Token:', token);
    console.log('Base URL:', app.globalData.baseUrl);
    console.log('Full API URL:', app.globalData.baseUrl+'/healthCondition/select');
    
    // 模拟后端API请求
    wx.request({
      url: app.globalData.baseUrl+'/healthCondition/select', // 实际后端API地址
      method: 'GET',
      data: {
        customerId: 113
      }, 
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      success: (res) => {
        console.log('API Response:', res);
        console.log('Status Code:', res.statusCode);
        console.log('Response Data:', res.data);
        if (res.statusCode === 200) {
          this.processHealthData(res.data.data);
        } else {
          console.error('加载健康数据失败:', res.data.message || '未知错误');
        }
      },
      fail: (err) => {
        console.error('加载健康数据失败:', err);
        this.loadMockData(); // 加载模拟数据
      },
      complete: () => {
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
      }
    });
  },

  /**
   * 加载模拟数据
   */
  loadMockData() {
    // 生成模拟数据，与新的JSON格式一致
    const mockData = [];
    const now = new Date();
    
    // 生成最近7天的数据
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const systolic = Math.floor(Math.random() * 30) + 110; // 收缩压 110-140
      const diastolic = Math.floor(Math.random() * 20) + 70; // 舒张压 70-90
      const heartRate = Math.floor(Math.random() * 30) + 60; // 心率 60-90
      const bloodOxygen = Math.floor(Math.random() * 5) + 95; // 血氧 95-100
      const bodyTemperature = (Math.random() * 1.5 + 36.0).toFixed(1); // 体温 36.0-37.5
      const fastingBloodSugar = (Math.random() * 2.0 + 4.0).toFixed(1); // 空腹血糖 4.0-6.0
      const bloodSugar2hAfterMeal = (Math.random() * 3.0 + 5.0).toFixed(1); // 餐后两小时血糖 5.0-8.0
      
      mockData.push({
        bloodOxygen: `${bloodOxygen}%`,
        bloodPressure: `${systolic}/${diastolic}`,
        bodyTemperature: `${bodyTemperature}℃`,
        create_time: `${date.getFullYear()}:${date.getMonth() + 1}:${date.getDate()}`,
        fastingBloodSugar: `${fastingBloodSugar}mmol/L`,
        bloodSugar2hAfterMeal: `${bloodSugar2hAfterMeal}mmol/L`,
        heartRate: `${heartRate}`,
        mobilityLevel: Math.floor(Math.random() * 3).toString(), // 0,1,2
        remark: i === 0 ? "轻度高血压，血糖临界，建议低盐饮食" : "健康状态良好",
        userId: 113
      });
    }
    
    this.processHealthData(mockData);
  },

  /**
   * 处理健康数据
   */
  processHealthData(data) {
    if (!data || data.length === 0) {
      this.setData({ hasData: false });
      return;
    }
    
    // 按照日期排序数据
    data.sort((a, b) => {
      // 解析日期字符串为Date对象
      // 确保日期格式为 "year:month:day"
      const aParts = a.create_time.split(':');
      const bParts = b.create_time.split(':');
      
      // 分别获取年、月、日
      const aYear = parseInt(aParts[0]);
      const aMonth = parseInt(aParts[1]);
      const aDay = parseInt(aParts[2]);
      
      const bYear = parseInt(bParts[0]);
      const bMonth = parseInt(bParts[1]);
      const bDay = parseInt(bParts[2]);
      
      // 先按年份比较
      if (aYear !== bYear) {
        return aYear - bYear;
      }
      
      // 年份相同，按月份比较
      if (aMonth !== bMonth) {
        return aMonth - bMonth;
      }
      
      // 月份相同，按日期比较
      return aDay - bDay;
    });
    
    // 初始化各指标数据结构
    const bloodPressureData = { labels: [], systolic: [], diastolic: [] };
    const heartRateData = { labels: [], values: [] };
    const bloodOxygenData = { labels: [], values: [] };
    const bodyTemperatureData = { labels: [], values: [] };
    const fastingBloodSugarData = { labels: [], values: [] };
    const bloodSugar2hAfterMealData = { labels: [], values: [] };
    
    // 处理每条数据
    data.forEach(item => {
      // 格式化日期（将 "2026:1:1" 格式转换为标准日期格式）
      const dateParts = item.create_time.split(':');
      const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const dateLabel = `${date.getMonth() + 1}-${date.getDate()}`;
      
      // 血压数据（从 "140/88" 格式提取收缩压和舒张压）
      const pressureParts = item.bloodPressure.split('/');
      const systolic = parseInt(pressureParts[0]);
      const diastolic = parseInt(pressureParts[1]);
      bloodPressureData.labels.push(dateLabel);
      bloodPressureData.systolic.push(systolic);
      bloodPressureData.diastolic.push(diastolic);
      
      // 心率数据
      heartRateData.labels.push(dateLabel);
      heartRateData.values.push(parseInt(item.heartRate));
      
      // 血氧数据（从 "96%" 格式提取纯数值）
      bloodOxygenData.labels.push(dateLabel);
      bloodOxygenData.values.push(parseFloat(item.bloodOxygen.replace('%', '')));
      
      // 体温数据（从 "36.8℃" 格式提取纯数值）
      bodyTemperatureData.labels.push(dateLabel);
      bodyTemperatureData.values.push(parseFloat(item.bodyTemperature.replace('℃', '')));
      
      // 空腹血糖数据（从 "6.0mmol/L" 格式提取纯数值）
      fastingBloodSugarData.labels.push(dateLabel);
      fastingBloodSugarData.values.push(parseFloat(item.fastingBloodSugar.replace('mmol/L', '')));
      
      // 餐后2小时血糖数据（如果存在）
      bloodSugar2hAfterMealData.labels.push(dateLabel);
      if (item.bloodSugar2hAfterMeal) {
        bloodSugar2hAfterMealData.values.push(parseFloat(item.bloodSugar2hAfterMeal.replace('mmol/L', '')));
      } else {
        bloodSugar2hAfterMealData.values.push(null);
      }
    });
    
    // 更新数据
    this.setData({
      hasData: true,
      healthData: data,
      bloodPressureData,
      heartRateData,
      bloodOxygenData,
      bodyTemperatureData,
      fastingBloodSugarData,
      bloodSugar2hAfterMealData
    });
    
    // 重新绘制图表
    this.drawCharts();
  },

  /**
   * 绘制所有图表
   */
  drawCharts() {
    if (!this.data.hasData) return;
    
    this.drawBloodPressureChart();
    this.drawHeartRateChart();
    this.drawBloodOxygenChart();
    this.drawBodyTemperatureChart();
    this.drawFastingBloodSugarChart();
    this.drawBloodSugar2hAfterMealChart();
  },

  /**
   * 绘制血压图表
   */
  drawBloodPressureChart() {
    const ctx = wx.createCanvasContext('bloodPressureChart');
    const data = this.data.bloodPressureData;
    
    // 设置画布尺寸
    const canvasWidth = 320;
    const canvasHeight = 200;
    const padding = 40;
    
    // 计算图表区域尺寸
    const chartWidth = canvasWidth - padding * 2;
    const chartHeight = canvasHeight - padding * 2;
    
    // 绘制坐标轴
    this.drawAxis(ctx, padding, padding, chartWidth, chartHeight, 'mmHg');
    
    // 绘制柱状图（收缩压和舒张压）
    this.drawBar(ctx, data.labels, data.systolic, data.diastolic, padding, padding, chartWidth, chartHeight);
    
    // 绘制图例
    this.drawLegend(ctx, padding, canvasHeight - 20, [
      { color: '#FF4444', text: '收缩压' },
      { color: '#4444FF', text: '舒张压' }
    ]);
    
    ctx.draw();
  },

  /**
   * 绘制心率图表
   */
  drawHeartRateChart() {
    const ctx = wx.createCanvasContext('heartRateChart');
    const data = this.data.heartRateData;
    
    // 设置画布尺寸
    const canvasWidth = 320;
    const canvasHeight = 200;
    const padding = 40;
    
    // 计算图表区域尺寸
    const chartWidth = canvasWidth - padding * 2;
    const chartHeight = canvasHeight - padding * 2;
    
    // 绘制坐标轴
    this.drawAxis(ctx, padding, padding, chartWidth, chartHeight, '次/分');
    
    // 绘制心率线
    this.drawLine(ctx, data.labels, data.values, padding, padding, chartWidth, chartHeight, '#FF8800');
    
    ctx.draw();
  },

  /**
   * 绘制血氧图表
   */
  drawBloodOxygenChart() {
    const ctx = wx.createCanvasContext('bloodOxygenChart');
    const data = this.data.bloodOxygenData;
    
    // 设置画布尺寸
    const canvasWidth = 320;
    const canvasHeight = 200;
    const padding = 40;
    
    // 计算图表区域尺寸
    const chartWidth = canvasWidth - padding * 2;
    const chartHeight = canvasHeight - padding * 2;
    
    // 绘制坐标轴
    this.drawAxis(ctx, padding, padding, chartWidth, chartHeight, '%');
    
    // 绘制血氧线
    this.drawLine(ctx, data.labels, data.values, padding, padding, chartWidth, chartHeight, '#00CC00');
    
    ctx.draw();
  },

  /**
   * 绘制体温图表
   */
  drawBodyTemperatureChart() {
    const ctx = wx.createCanvasContext('bodyTemperatureChart');
    const data = this.data.bodyTemperatureData;
    
    // 设置画布尺寸
    const canvasWidth = 320;
    const canvasHeight = 200;
    const padding = 40;
    
    // 计算图表区域尺寸
    const chartWidth = canvasWidth - padding * 2;
    const chartHeight = canvasHeight - padding * 2;
    
    // 绘制坐标轴
    this.drawAxis(ctx, padding, padding, chartWidth, chartHeight, '°C');
    
    // 绘制体温线
    this.drawLine(ctx, data.labels, data.values, padding, padding, chartWidth, chartHeight, '#FF6666');
    
    ctx.draw();
  },

  /**
   * 绘制空腹血糖图表
   */
  drawFastingBloodSugarChart() {
    const ctx = wx.createCanvasContext('fastingBloodSugarChart');
    const data = this.data.fastingBloodSugarData;
    
    // 设置画布尺寸
    const canvasWidth = 320;
    const canvasHeight = 200;
    const padding = 40;
    
    // 计算图表区域尺寸
    const chartWidth = canvasWidth - padding * 2;
    const chartHeight = canvasHeight - padding * 2;
    
    // 绘制坐标轴
    this.drawAxis(ctx, padding, padding, chartWidth, chartHeight, 'mmol/L');
    
    // 绘制空腹血糖线
    this.drawLine(ctx, data.labels, data.values, padding, padding, chartWidth, chartHeight, '#8888FF');
    
    ctx.draw();
  },

  /**
   * 绘制餐后2小时血糖图表
   */
  drawBloodSugar2hAfterMealChart() {
    const ctx = wx.createCanvasContext('bloodSugar2hAfterMealChart');
    const data = this.data.bloodSugar2hAfterMealData;
    
    // 设置画布尺寸
    const canvasWidth = 320;
    const canvasHeight = 200;
    const padding = 40;
    
    // 计算图表区域尺寸
    const chartWidth = canvasWidth - padding * 2;
    const chartHeight = canvasHeight - padding * 2;
    
    // 绘制坐标轴
    this.drawAxis(ctx, padding, padding, chartWidth, chartHeight, 'mmol/L');
    
    // 绘制餐后2小时血糖线
    this.drawLine(ctx, data.labels, data.values, padding, padding, chartWidth, chartHeight, '#FF88FF');
    
    ctx.draw();
  },

  /**
   * 绘制坐标轴
   */
  drawAxis(ctx, x, y, width, height, unit) {
    // 设置线条样式
    ctx.setStrokeStyle('#CCCCCC');
    ctx.setLineWidth(1);
    
    // 绘制x轴
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
    
    // 绘制y轴
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();
    
    // 绘制单位
    ctx.setFillStyle('#666666');
    ctx.setFontSize(10);
    ctx.fillText(unit, x - 30, y + 10);
  },

  /**
   * 绘制折线
   */
  drawLine(ctx, labels, values, x, y, width, height, color) {
    if (!values || values.length === 0) return;
    
    // 过滤掉null值
    const validValues = values.filter(v => v !== null && v !== undefined);
    if (validValues.length === 0) return;
    
    // 计算数据范围
    const minValue = Math.min(...validValues);
    const maxValue = Math.max(...validValues);
    const valueRange = maxValue - minValue || 1;
    
    // 设置线条样式
    ctx.setStrokeStyle(color);
    ctx.setLineWidth(2);
    ctx.setFillStyle(color);
    
    // 计算点的位置
    const pointCount = values.length;
    const pointSpacing = width / (pointCount - 1 || 1);
    
    // 绘制折线
    ctx.beginPath();
    
    // 先计算所有点的位置，用于绘制折线
    const points = [];
    let firstValidPoint = true;
    
    values.forEach((value, index) => {
      const pointX = x + index * pointSpacing;
      let pointY;
      
      if (value !== null && value !== undefined) {
        pointY = y + height - ((value - minValue) / valueRange) * height;
        points.push({ x: pointX, y: pointY, value: value, valid: true });
        
        // 绘制折线
        if (firstValidPoint) {
          ctx.moveTo(pointX, pointY);
          firstValidPoint = false;
        } else {
          ctx.lineTo(pointX, pointY);
        }
      } else {
        points.push({ x: pointX, y: null, value: value, valid: false });
      }
    });
    
    // 绘制折线
    ctx.stroke();
    
    // 绘制数据点和数值标签
    points.forEach((point, index) => {
      if (point.valid) {
        // 绘制数据点
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制数值标签（在点的左边）
        ctx.setFillStyle('#666666');
        ctx.setFontSize(10);
        ctx.fillText(point.value, point.x - 25, point.y + 3);
      }
      
      // 绘制日期标签
      ctx.fillText(labels[index], point.x - 15, y + height + 15);
    });
  },
  
  /**
   * 绘制柱状图
   */
  drawBar(ctx, labels, systolicValues, diastolicValues, x, y, width, height) {
    if (!systolicValues || !diastolicValues || systolicValues.length === 0 || diastolicValues.length === 0) return;
    
    // 过滤掉null值
    const allValues = [...systolicValues, ...diastolicValues];
    const validValues = allValues.filter(v => v !== null && v !== undefined);
    if (validValues.length === 0) return;
    
    // 计算数据范围
    const minValue = Math.min(...validValues) * 0.9; // 给最小值留10%的边距
    const maxValue = Math.max(...validValues) * 1.1; // 给最大值留10%的边距
    const valueRange = maxValue - minValue || 1;
    
    // 计算柱子的位置和宽度
    const pointCount = systolicValues.length;
    const barGroupWidth = width / (pointCount || 1);
    const barWidth = barGroupWidth * 0.4; // 每个柱子宽度
    const barSpacing = barGroupWidth * 0.1; // 柱子之间的间距
    
    // 绘制每个日期的柱状图
    systolicValues.forEach((systolicValue, index) => {
      const diastolicValue = diastolicValues[index];
      const groupX = x + index * barGroupWidth;
      
      // 绘制收缩压柱子（红色）
      if (systolicValue !== null && systolicValue !== undefined) {
        const barHeight = ((systolicValue - minValue) / valueRange) * height;
        const barY = y + height - barHeight;
        
        ctx.setFillStyle('#FF4444');
        ctx.fillRect(groupX, barY, barWidth, barHeight);
        
        // 绘制收缩压数值
        ctx.setFillStyle('#666666');
        ctx.setFontSize(10);
        ctx.fillText(systolicValue, groupX, barY - 5);
      }
      
      // 绘制舒张压柱子（蓝色）
      if (diastolicValue !== null && diastolicValue !== undefined) {
        const barHeight = ((diastolicValue - minValue) / valueRange) * height;
        const barY = y + height - barHeight;
        const barX = groupX + barWidth + barSpacing;
        
        ctx.setFillStyle('#4444FF');
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 绘制舒张压数值
        ctx.setFillStyle('#666666');
        ctx.setFontSize(10);
        ctx.fillText(diastolicValue, barX, barY - 5);
      }
      
      // 绘制日期标签
      ctx.setFillStyle('#666666');
      ctx.setFontSize(10);
      ctx.fillText(labels[index], groupX, y + height + 15);
    });
  },

  /**
   * 绘制图例
   */
  drawLegend(ctx, x, y, items) {
    items.forEach((item, index) => {
      // 绘制颜色块
      ctx.setFillStyle(item.color);
      ctx.fillRect(x + index * 80, y, 10, 10);
      
      // 绘制文字
      ctx.setFillStyle('#666666');
      ctx.setFontSize(10);
      ctx.fillText(item.text, x + index * 80 + 15, y + 9);
    });
  }
})