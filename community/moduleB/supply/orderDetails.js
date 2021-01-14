let app = getApp();
var status = require('../../utils/index.js');

Page({
  mixins: [require('static/orderMixin.js')],
  data: {
    common_header_backgroundimage: app.globalData.common_header_backgroundimage,
  },
  id: '',

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let id = options.id || '';
    if(!id) {
      app.util.message('参数错误', '/community/moduleB/supply/orderManage', 'error');
      return;
    }
    this.id = id;
    status.setGroupInfo().then((groupInfo) => {
      this.setData({ groupInfo })
    });
    this.initFn(id);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  initFn: function(){
    wx.showLoading();
    let id = this.id;
    let token = wx.getStorageSync('token');
    app.util.ProReq('order.order_info', {token, id, is_supply: 1}).then(res=>{
      let order = res.data;
      let { is_hidden_orderlist_phone } = res;

      let { real_total, shipping_fare, voucher_credit, fullreduction_money } = order.order_info;
      var goodsTotal = parseFloat(real_total) - parseFloat(shipping_fare);
      let disAmount = parseFloat(voucher_credit) + parseFloat(fullreduction_money);
      disAmount = (disAmount > goodsTotal) ? goodsTotal : disAmount;

      let levelAmount = 0;
      let order_goods_list = order.order_goods_list;
      if(order_goods_list&&order_goods_list.length) {
        order_goods_list.forEach(function(item){
          let total = item.total * 1;
          let old_total = item.old_total * 1;
          if (item.is_level_buy==1 || item.is_vipcard_buy==1) {
            levelAmount += old_total - total;
          }
        })
      }

      this.setData({
        order,
        is_hidden_orderlist_phone,
        goodsTotal: goodsTotal.toFixed(2),
        disAmount: disAmount.toFixed(2),
        levelAmount: levelAmount.toFixed(2)
      })
    }).catch(err=>{
      app.util.message(err.msg, 'switchTo:/community/pages/user/me', 'error');
    })
  },

  callTelphone: function (t) {
    var e = this;
    this.data.isCalling || (this.data.isCalling = true, wx.makePhoneCall({
      phoneNumber: t.currentTarget.dataset.phone,
      complete: function () {
        e.data.isCalling = false;
      }
    }));
  },

  goExpress: function(){
    let order_id = this.data.order.order_info.order_id;
    wx.navigateTo({
      url: '/community/pages/order/goods_express?id=' + order_id,
    })
  }
})