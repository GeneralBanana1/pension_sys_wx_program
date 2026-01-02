// custom-tab-bar/index.js
const app = getApp();

Component({
  data: {
    activeIndex: 0,
    tabList: []
  },
  attached() {
    this.setTabList();
    this.updateActiveIndex();
  },
  methods: {
    setTabList() {
      const role = app.globalData.currentRole;
      const tabList = app.globalData.roleTabs[role];
      this.setData({
        tabList: tabList
      });
    },
    updateActiveIndex() {
      // 获取当前页面路径
      const pages = getCurrentPages();
      if (pages.length === 0) {
        return;
      }
      
      const currentPage = pages[pages.length - 1];
      if (!currentPage) {
        return;
      }
      
      const currentPath = currentPage.route;
      if (!currentPath) {
        return;
      }
      
      // 重新获取tabList，确保是最新的
      const role = app.globalData.currentRole;
      const tabList = app.globalData.roleTabs[role];
      
      // 查找当前页面在tabList中的索引
      let activeIndex = 0;
      let found = false;
      
      for (let i = 0; i < tabList.length; i++) {
        console.log('检查页面路径：', tabList[i].pagePath, '===', currentPath);
        // 直接比较路径，或者使用endsWith检查路径的结尾是否匹配
        if (tabList[i].pagePath === currentPath || currentPath.endsWith(tabList[i].pagePath)) {
          activeIndex = i;
          found = true;
          break;
        }
      }
      
      // 如果没找到，默认选中第一个
      if (!found) {
        console.log('未找到匹配的页面路径，默认选中第一个');
        activeIndex = 0;
      }
      
      // 立即更新高亮状态
      this.setData({
        tabList: tabList,
        activeIndex: activeIndex
      }, () => {
        console.log('高亮状态更新完成，当前索引：', activeIndex);
      });
    },
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      const index = e.currentTarget.dataset.index;
      
      // 立即更新UI，减少延迟感
      this.setData({
        activeIndex: index
      });
      
      wx.switchTab({
        url: '/' + path
      });
    }
  }
})