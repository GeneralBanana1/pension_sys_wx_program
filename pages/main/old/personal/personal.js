// pages/profile/profile.js
Page({
  data: {
    // 用户信息
    userInfo: {
      id: 'ELDER2024001',
      name: '张奶奶',
      age: 78,
      gender: 2, // 0:未知, 1:男, 2:女
      birthday: '1946-03-15',
      phone: '138****8000',
      idCard: '1101011946********',
      bloodType: 'A型',
      address: '北京市朝阳区团结湖小区12栋3单元502室',
      livingStatus: '独居',
      medicalRecords: 3,
      allergyCount: 1,
      medicationCount: 2,
      emergencyName: '张明',
      emergencyRelation: '儿子',
      emergencyPhone: '138****8001',
      emergencyName2: '王阿姨',
      emergencyRelation2: '护工',
      emergencyPhone2: '138****8002',
      caregiver: '王阿姨',
      servicePhone: '400-123-4567',
      lastService: '2024-03-15 上门服务',
      careLevel: '二级',
      avatar: '/images/avatar-elder.png'
    },
    
    genderText: '女',
    updateTime: '2024-03-16 10:30'
  },

  onLoad() {
    this.loadUserData();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadUserData();
  },

  // 加载用户数据
  loadUserData() {
    // 从缓存读取
    const cachedData = wx.getStorageSync('userProfileData');
    if (cachedData) {
      this.setDisplayData(cachedData);
    }
    
    // 模拟从服务器获取数据
    setTimeout(() => {
      const mockData = {
        id: 'ELDER2024001',
        name: '张奶奶',
        age: 78,
        gender: 2,
        birthday: '1946-03-15',
        phone: '138****8000',
        idCard: '1101011946********',
        bloodType: 'A型',
        address: '北京市朝阳区团结湖小区12栋3单元502室',
        livingStatus: '独居',
        medicalRecords: 3,
        allergyCount: 1,
        medicationCount: 2,
        emergencyName: '张明',
        emergencyRelation: '儿子',
        emergencyPhone: '138****8001',
        emergencyName2: '王阿姨',
        emergencyRelation2: '护工',
        emergencyPhone2: '138****8002',
        caregiver: '王阿姨',
        servicePhone: '400-123-4567',
        lastService: '2024-03-15 上门服务',
        careLevel: '二级',
        avatar: '/images/avatar-elder.png',
        updateTime: new Date().toISOString()
      };
      
      this.setDisplayData(mockData);
      wx.setStorageSync('userProfileData', mockData);
    }, 500);
  },

  // 设置显示数据
  setDisplayData(data) {
    const genderMap = ['未知', '男', '女'];
    const genderText = genderMap[data.gender] || '未知';
    
    // 计算年龄
    let age = '--';
    if (data.birthday) {
      const birthYear = new Date(data.birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      age = currentYear - birthYear;
    }
    
    this.setData({
      'userInfo.id': data.id || 'ELDER001',
      'userInfo.name': data.name || '',
      'userInfo.age': age,
      'userInfo.gender': data.gender || 0,
      'userInfo.birthday': data.birthday || '',
      'userInfo.phone': data.phone || '',
      'userInfo.idCard': data.idCard || '',
      'userInfo.bloodType': data.bloodType || '',
      'userInfo.address': data.address || '',
      'userInfo.livingStatus': data.livingStatus || '',
      'userInfo.medicalRecords': data.medicalRecords || 0,
      'userInfo.allergyCount': data.allergyCount || 0,
      'userInfo.medicationCount': data.medicationCount || 0,
      'userInfo.emergencyName': data.emergencyName || '',
      'userInfo.emergencyRelation': data.emergencyRelation || '',
      'userInfo.emergencyPhone': data.emergencyPhone || '',
      'userInfo.careLevel': data.careLevel || '普通',
      'userInfo.avatar': data.avatar || '',
      genderText
    });
  },

  // 导航到首页
  navigateToHome() {
    wx.navigateTo({
      url: '/pages/main/old/index/index'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUserData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '信息已更新',
        icon: 'success'
      });
    }, 1000);
  }
});