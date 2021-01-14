var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    is_heng: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let id = options.id || '';
    this.get_goods_details(id);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  goDetails: function(){
    let goods = this.data.goods;
    let id = goods.id || '';
    id && wx.redirectTo({
      url: `/community/pages/goods/goodsDetail?id=${id}`,
    })
  },

  get_goods_details: function (id) {
    let that = this;
    if (!id) {
      wx.hideLoading();
      wx.showModal({
        title: '提示',
        content: '参数错误',
        showCancel: false,
        confirmColor: '#13bb4e',
        success(res) {
          if (res.confirm) {
            wx.redirectTo({
              url: '/community/pages/index/index',
            })
          }
        }
      })
      return false;
    }
    let token = wx.getStorageSync('token');
    let community = wx.getStorageSync('community');
    let community_id = community.communityId || '';
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'goods.get_goods_detail',
        token: token,
        id,
        community_id
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        let goods = (res.data.data && res.data.data.goods) || '';
        // 商品不存在
        if (!goods || goods.length == 0 || Object.keys(goods) == '') {
          wx.showModal({
            title: '提示',
            content: '该商品不存在，回首页',
            showCancel: false,
            confirmColor: '#13bb4e',
            success(res) {
              if (res.confirm) {
                wx.switchTab({
                  url: '/community/pages/index/index',
                })
              }
            }
          })
        }
        that.currentOptions = res.data.data.options;
        that.setData({
          goods: goods,
          options: res.data.data.options,
          order: {
            goods_id: res.data.data.goods.goods_id,
            pin_id: res.data.data.pin_id,
          },
          share_title: goods.share_title,
          goods_image: res.data.data.goods_image
        })
      }
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    var community = wx.getStorageSync('community');
    var goods = this.data.goods;
    var community_id = community.communityId;
    var share_title = this.data.share_title;
    var share_id = wx.getStorageSync('member_id');
    var share_path = 'community/pages/video/detail?id=' + goods.id + '&share_id=' + share_id + '&community_id=' + community_id;
    let shareImg = this.data.goods.goods_share_image;
    console.log('商品分享地址：', share_path);

    return {
      title: share_title,
      path: share_path,
      imageUrl: shareImg,
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }

  }
})