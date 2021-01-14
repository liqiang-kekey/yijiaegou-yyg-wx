Page({
  data: {
    tabs: [
      { id: 0, name: '全部' },
      { id: 1, name: '待取货' },
      { id: 2, name: '待配送' },
      { id: 3, name: '配送中' }
    ],
    status: 0,
    list: []
  },
  pageNum: 1,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  changeTabs: function (e) {
    let that = this;
    let status = e.currentTarget.dataset.type || 0;
    this.pageNum = 1;
    this.setData({ status, list: [], showEmpty: false, loadMore: true }, ()=>{
      // that.getData();
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  }
})