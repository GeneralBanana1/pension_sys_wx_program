// login.js
const app = getApp();

Page({
  data: {
    loading: false,
    userInfo: null,
    // API配置
    baseUrl: 'http://localhost:8080',
    api: {
      // 登录相关接口
      login: '/wxLogin',
      //获取用户角色GET
      getRole: '/user/info/role',
      // 用户信息接口
      getUserInfo: '/user/info/getUserInfo',
      // 用户授权角色接口POST
      authRole: '/user/info/role'
    }
  },
  onLoad() {
  },
  // 微信登录按钮点击事件
  handleWechatLogin() {
    this.setData({ loading: true });
    
    // 显示加载动画
    wx.showLoading({
      title: '登录中...',
      mask: true
    });
    
    // 1. 先获取用户授权
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (userRes) => {
        // 2. 获取用户授权后，调用wx.login获取code
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              // 3. 调用后端登录接口
              this.wxLogin(loginRes.code, userRes);
            } else {
              wx.showToast({ title: '登录失败：' + loginRes.errMsg, icon: 'none' });
              this.setData({ loading: false });
              wx.hideLoading();
            }
          },
          fail: (loginErr) => {
            wx.showToast({ title: '登录失败：' + loginErr.errMsg, icon: 'none' });
            this.setData({ loading: false });
            wx.hideLoading();
          }
        });
      },
      fail: (userErr) => {
        // 用户拒绝授权
        wx.showToast({ title: '请授权后登录', icon: 'none' });
        this.setData({ loading: false });
        wx.hideLoading();
      }
    });
  },
  // 调用后端登录接口
  wxLogin(code, userRes) {
    const { encryptedData, iv } = userRes;
    
    // 打印请求参数，用于调试
    console.log('登录请求参数：', {
      code,
      encryptedData,
      encryptedIv: iv
    });
    console.log('请求URL：', this.data.baseUrl + this.data.api.login);
    
    // 调用后端登录API
    wx.request({
      url: this.data.baseUrl + this.data.api.login,
      method: 'POST',
      data: {
        code,
        encryptedData,
        encryptedIv: iv
      },
      success: (res) => {
        console.log('登录响应：', res);
        
        if (res.data && res.data.code === 200) {
          // 登录成功，获取token
          const token = res.data.token || '';
          // 登录成功
          app.login(token);
          // 获取用户角色
          this.getUserRole();
        } else {
          wx.showToast({ title: '登录失败：' + (res.data.msg || '未知错误'), icon: 'none' });
          this.setData({ loading: false });
          wx.hideLoading();
        }
      },
      fail: (err) => {
        console.error('登录请求失败：', err);
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
        this.setData({ loading: false });
        wx.hideLoading();
      },
      complete: () => {
        console.log('登录请求完成');
      }
    });
  },
  // 获取用户角色
  getUserRole() {
    console.log('获取用户角色请求URL：', this.data.baseUrl + this.data.api.getRole);
    
    wx.request({
      url: this.data.baseUrl + this.data.api.getRole,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      success: (res) => {
        console.log('获取角色响应：', res);
        wx.hideLoading();
        
        // 检查roleId是否为空
        const role = res.data && res.data.code === 200 ? res.data.data : null;
        
        // 无论roleId是否为空，先获取用户信息
        this.getUserInfo(role);
      },
      fail: (err) => {
        console.error('获取角色请求失败：', err);
        wx.hideLoading();
        // 网络错误，跳转到角色选择页面
        wx.showToast({
          title: '请选择角色',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/role-select/role-select'
              });
            }, 1500);
          }
        });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },
  // 获取用户信息
  getUserInfo(role) {
    console.log('获取用户信息请求URL：', this.data.baseUrl + this.data.api.getUserInfo);
    
    wx.request({
      url: this.data.baseUrl + this.data.api.getUserInfo,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      success: (res) => {
        console.log('获取用户信息响应：', res);
        
        if (res.data && res.data.code === 200) {
          // 保存用户信息到全局变量
          app.setUserInfo(res.data.data);
          // 打印用户信息
          console.log('用户信息：', app.globalData.userInfo);
        }
        
        // 根据role是否为空决定跳转逻辑
        if (role !== null && role !== undefined && role !== '') {
          // roleId不为空，跳转到对应角色的首页
          app.switchRole(role.toString());
          
          // 根据roleId选择跳转路径
          let redirectUrl = '/pages/index/index'; // 默认首页
          
          if (role.toString() === '100') {
            // 老人角色，跳转到老人首页
            redirectUrl = '/pages/main/old/index/index';
          }
          
          wx.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                wx.switchTab({
                  url: redirectUrl
                });
              }, 1500);
            }
          });
        } else {
          // roleId为空，跳转到角色选择页面
          wx.showToast({
            title: '请选择角色',
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                wx.navigateTo({
                  url: '/pages/role-select/role-select'
                });
              }, 1500);
            }
          });
        }
      },
      fail: (err) => {
        console.error('获取用户信息请求失败：', err);
        
        // 网络错误，根据role是否为空决定跳转逻辑
        if (role !== null && role !== undefined && role !== '') {
          // roleId不为空，跳转到首页
          app.switchRole(role.toString());
          wx.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }, 1500);
            }
          });
        } else {
          // roleId为空，跳转到角色选择页面
          wx.showToast({
            title: '请选择角色',
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                wx.navigateTo({
                  url: '/pages/role-select/role-select'
                });
              }, 1500);
            }
          });
        }
      }
    });
  }
})