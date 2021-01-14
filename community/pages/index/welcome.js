// community/pages/welcome.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgsData:[{
      imageid:0,
      imageUrl:'https://yyg.yijiaegou.com/Uploads/image/goods/2020-12-29/5feadd91b0a79.jpg',
      imageHref:'/community/pages/index/index'
    },
    {
      imageid:1,
      imageUrl:'https://yyg.yijiaegou.com/Uploads/image/goods/2020-12-31/5fed6b543543c.jpg',
      imageHref:'/community/pages/goods/goodsDetail?id=358'
    }],
    isAutoIndex: true,
    imageAutoplay:false,
    indicatorDots:true,
    intervalAutoTime:2000,
    intoIndexTime:5000,
    imagecurrent:0,
    buttonName:'立即进入'
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this;
    this.initWelcomeConfig();
    setTimeout(function(){
      if(that.data.isAutoIndex){
        that.goToIndexUrl();
      }      
    }, that.data.intoIndexTime);
  },

  goToImgeUrl: function (e) {
    var imageHref = e.currentTarget.dataset.href;
    var imageid = e.currentTarget.dataset.idx;
    if(imageHref != undefined && imageHref != ''){
      this.setData({isAutoIndex : false});
      if(imageid == 0){
        wx.switchTab({
          url: imageHref
        });
      }else{
        wx.navigateTo({
          url: imageHref
        });
      }      
    }    
  },

  initWelcomeConfig: function(){
    if(this.data.imagecurrent == 1 && !this.data.isAutoIndex){
      this.goToIndexUrl();
      //this.setData({isAutoIndex : true, imagecurrent : 0});
    }
    this.switchCurrentImge();
  },

  switchCurrentImge: function(){
    let that = this;
    setTimeout(function(){
      that.setData({imagecurrent : 1});    
    }, that.data.intoIndexTime/3);
  },

  goToIndexUrl: function(){
    wx.switchTab({
      url: '/community/pages/index/index'
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {}
})