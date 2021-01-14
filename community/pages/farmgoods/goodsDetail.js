// community/pages/goods/goodsDetail.js
var util = require('../../utils/util.js');
var status = require('../../utils/index.js');
var app = getApp();
var detailClearTime = null;

function count_down(that, total_micro_second) {
  var second = Math.floor(total_micro_second / 1000);
  var days = second / 3600 / 24;
  var daysRound = Math.floor(days);
  var hours = second / 3600 - (24 * daysRound);
  var hoursRound = Math.floor(hours);
  var minutes = second / 60 - (24 * 60 * daysRound) - (60 * hoursRound);
  var minutesRound = Math.floor(minutes);
  var seconds = second - (24 * 3600 * daysRound) - (3600 * hoursRound) - (60 * minutesRound);

  that.setData({
    endtime: {
      days: fill_zero_prefix(daysRound),
      hours: fill_zero_prefix(hoursRound),
      minutes: fill_zero_prefix(minutesRound),
      seconds: fill_zero_prefix(seconds),
      show_detail: 1
    }
  });

  if (total_micro_second <= 0) {
    clearTimeout(detailClearTime);
    detailClearTime = null;
    if (that.data.goods.over_type==0){
      that.authSuccess();
    }
    that.setData({
      endtime: {
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      }
    });
    return;
  }

  detailClearTime = setTimeout(function() {
    total_micro_second -= 1000;
    count_down(that, total_micro_second);
  }, 1000)

}
// 位数不足补零
function fill_zero_prefix(num) {
  return num < 10 ? "0" + num : num
}

Page({
  mixins: [require('../../mixin/globalMixin.js')],
  data: {
    needAuth: false,
    goodsIndex: 1,
    goods_id: 0,
    endtime: {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    },
    is_share_html: true,
    stickyFlag: false,
    showSkeleton: true,
    imageSize: {
      imageWidth: "100%",
      imageHeight: 600
    },
    cartNum: 0,
    noIns: false,
    index_bottom_image: '',
    hideModal: true,
    shareImgUrl: '',
    goods_details_middle_image: '',
    is_show_buy_record: 0,
    stopNotify: true,
    iconArr: {
      home: '',
      car: ''
    },
    canvasWidth: 375,
    canvasHeight: 300,
    fmShow: true,
    relative_goods_list: [],
    needPosition: false,
    groupInfo: {
      group_name: '社区',
      owner_name: '团长'
    },
    showCoverVideo: false // Todo
  },
  $data: {
    stickyFlag: false,
    id: '',
    scene: '',
    community_id: 0
  },
  imageUrl: '',
  goodsImg: '',
  currentOptions: [],
  focusFlag: false,
  buy_type: '',

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    app.globalData.navBackUrl = '';
    var that = this;
    status.setNavBgColor();
    status.setGroupInfo().then((groupInfo) => { that.setData({ groupInfo }) });
    status.setIcon().then(function (iconArr){
      that.setData({ iconArr });
    });
    let room_id = options.room_id || '';
    if(!room_id){
      var scene = decodeURIComponent(options.scene);
      if (scene !== 'undefined') {
        var opt_arr = scene.split("_");
        options.id = opt_arr[0];
        options.share_id = opt_arr[1]
        options.community_id = opt_arr[2];
      }
    }
    if (options.share_id != 'undefined' && options.share_id > 0) wx.setStorage({ key: "share_id", data: options.share_id });
    let buy_type = options.type || '';
    this.buy_type = buy_type;

    this.$data.id = options.id;
    this.$data.community_id = options.community_id;
    this.$data.scene = options.scene;

    let h = {
      canvasWidth: app.globalData.systemInfo.windowWidth,
      canvasHeight: 0.8 * app.globalData.systemInfo.windowWidth,
      buy_type,
      goods_id: options.id
    };
    
    // 当前本地社区
    let currentCommunity = wx.getStorageSync('community');
    let currentCommunity_id = (currentCommunity && currentCommunity.communityId) || '';
    wx.showLoading();

    if (options.community_id != 'undefined' && options.community_id > 0 && buy_type!='integral') {
      // 存在分享社区进行比较
      if (currentCommunity_id) {
        console.log('step3 本地社区存在')
        this.paramHandle(options, currentCommunity);
      } else {
        // 当前本地社区不存在
        let community = {};
        community.communityId = options.community_id;
        util.getCommunityInfo().then(function(res){
          console.log('step1 分享来的社区', res);
          that.paramHandle(options, res);
        }).catch((param)=>{
          console.log('step4 新人')
          if(Object.keys(param) != '')  util.addhistory(param, true);
        });
      }
    } else {
      // 没有分享社区直接访问
      util.getCommunityById(0).then(ret=>{
        console.log('没有分享社区直接访问', ret)
        if (ret.open_danhead_model == 1) {
          let default_head_info = ret.default_head_info;
          console.log('default_head_info', default_head_info)
          app.globalData.community = default_head_info;
          if(currentCommunity && (currentCommunity.communityId != default_head_info.communityId)) app.globalData.changedCommunity = true;
          util.addhistory(default_head_info);
          wx.setStorage({ key: "community", data: default_head_info })
          that.setData({ community: default_head_info })
          that.get_goods_details(options.id, default_head_info, '');
        } else {
          util.getCommunityInfo().then(res=>{
            if(res) {
              that.setData({ community: res })
              that.get_goods_details(options.id, '', res.communityId);
            } else {
              that.setData({ community: currentCommunity });
              that.get_goods_details(options.id, '', currentCommunity_id);
            }
          })
        }
      })
    }
    
    that.setData(h);
    this.get_instructions();
  },

  /**
   * 比较社区
   * @param {分享参数} options
   * @param {本地社区信息} currentCommunity
   */
  paramHandle: function (options, currentCommunity=""){
    console.log('step2')
    let that = this;
    let { id, community_id } = options;
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'index.get_community_info',
        community_id
      },
      dataType: 'json',
      success: function (res) {
        if (res.data.code == 0) {
          let shareCommunity = res.data.data;
          console.log(shareCommunity)
          let currentCommunityId = currentCommunity.communityId;
          //单社区
          if (res.data.open_danhead_model == 1) {
            let default_head_info = res.data.default_head_info;
            app.globalData.community = default_head_info;
            if(currentCommunity && (currentCommunity.communityId != default_head_info.communityId)) app.globalData.changedCommunity = true;
            util.addhistory(default_head_info);
            wx.setStorage({ key: "community", data: default_head_info })
            that.setData({ community: default_head_info })
            that.get_goods_details(id, default_head_info, '');
          } else {
            if (currentCommunityId == community_id || shareCommunity=='') {
              console.log('step5 分享与本地相同')
              wx.setStorageSync('community', shareCommunity);
              that.setData({ community: shareCommunity })
              that.get_goods_details(options.id, '', community_id);
            } else {
              if (currentCommunityId) {
                that.setData({
                  showChangeCommunity: true,
                  changeCommunity: shareCommunity,
                  community: currentCommunity
                })
                that.get_goods_details(options.id, '', currentCommunityId);
              } else {
                that.setData({ changeCommunity: shareCommunity }, () => {
                  that.confrimChangeCommunity();
                })
              }
            }
          }
        }
      }
    })
  },

  get_goods_details: function (id, communityInfo='', currentCommunity_id){
    let that = this;
    if(!id) {
      wx.hideLoading();
      wx.showModal({
        title: '提示',
        content: '参数错误',
        showCancel: false,
        confirmColor: '#F75451',
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
    if(communityInfo) currentCommunity_id = communityInfo.communityId;
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'goods.get_goods_detail',
        token: token,
        id,
        community_id: currentCommunity_id
      },
      dataType: 'json',
      success: function (res) {
        setTimeout(function(){ wx.hideLoading(); },1000);
        let { goods, is_can_headsales } = res.data.data;
        // 商品不存在
        if (!goods || goods.nogoods || Object.keys(goods) == '') {
          return wx.showModal({
            title: '提示',
            content: '该商品不存在，回首页',
            showCancel: false,
            confirmColor: '#F75451',
            success(res) {
              if (res.confirm) {
                wx.switchTab({
                  url: '/community/pages/index/index',
                })
              }
            }
          })
        }

        if(is_can_headsales==0&&that.buy_type!='integral') {
          let groupInfo = that.data.groupInfo;
          app.util.message(`此商品在您所属${groupInfo.group_name}不可参与`, 'switchTo:/community/pages/index/index','error');
        }

        let comment_list = res.data.comment_list;
        comment_list.map(function (item) {
          14 * item.content.length / app.globalData.systemInfo.windowWidth > 3 && (item.showOpen = true), item.isOpen = true;
        })

        // 幻灯片预览数组
        let goods_images = res.data.data.goods_image || '';
        let prevImgArr = [];
        if (Object.prototype.toString.call(goods_images) == '[object Array]' && goods_images.length > 0) {
          goods_images.forEach(function (item) { prevImgArr.push(item.image); })
        }

        //群分享
        let isopen_community_group_share = res.data.isopen_community_group_share || 0;
        let group_share_info = res.data.group_share_info;

        // 关联商品
        let relative_goods_list = res.data.data.relative_goods_list || [];
        let relative_goods_list_arr = [];
        if (Object.prototype.toString.call(relative_goods_list) == '[object Object]' && Object.keys(relative_goods_list).length > 0) {
          Object.keys(relative_goods_list).forEach(function (item) {
            relative_goods_list_arr.push(relative_goods_list[item]);
          })
        } else {
          relative_goods_list_arr = relative_goods_list;
        }

        // 会员
        let { is_need_subscript, need_subscript_template, is_open_vipcard_buy, modify_vipcard_name, is_vip_card_member, modify_vipcard_logo, is_member_level_buy, is_only_hexiao, hexiao_arr, is_hide_details_count } = res.data;
        let goodsPrice = goods.price || 0;
        let goodsCardPrice = goods.card_price || 0;
        goods.feePrice = (goodsPrice - goodsCardPrice).toFixed(2);

        // 佣金
        let { is_commiss_mb, commiss_mb_money, is_goods_head_mb, goods_head_money } = res.data.data;

        let hx_len = Object.keys(hexiao_arr).length;
        that.currentOptions = res.data.data.options;

        //开启全屏视频
        let showCoverVideo = false;
        if(goods.video && res.data.is_open_goods_full_video==1) {
          showCoverVideo = true
        }

        let goodsImg = res.data.data.goods_image || [];

        that.setData({
          showCoverVideo,
          order_comment_count: res.data.order_comment_count,
          comment_list: comment_list,
          goods: goods,
          options: res.data.data.options,
          order: {
            goods_id: res.data.data.goods.goods_id,
            pin_id: res.data.data.pin_id,
          },
          share_title: goods.share_title,
          buy_record_arr: res.data.data.buy_record_arr,
          goods_image: goodsImg,
          goods_image_length: goodsImg.length,
          service: goods.tag,
          showSkeleton: false,
          is_comunity_rest: res.data.is_comunity_rest,
          prevImgArr,
          open_man_orderbuy: res.data.open_man_orderbuy,
          man_orderbuy_money: res.data.man_orderbuy_money,
          goodsdetails_addcart_bg_color: res.data.goodsdetails_addcart_bg_color || 'linear-gradient(270deg, #f9c706 0%, #feb600 100%)',
          goodsdetails_buy_bg_color: res.data.goodsdetails_buy_bg_color || 'linear-gradient(90deg, #ff5041 0%, #ff695c 100%)',
          isopen_community_group_share,
          group_share_info,
          relative_goods_list: relative_goods_list_arr,
          needPosition: currentCommunity_id ? true : false,
          is_close_details_time: res.data.is_close_details_time || 0,
          is_open_vipcard_buy: is_open_vipcard_buy || 0,
          modify_vipcard_name,
          is_vip_card_member: is_vip_card_member || 0,
          modify_vipcard_logo,
          is_commiss_mb, 
          commiss_mb_money, 
          is_goods_head_mb, 
          goods_head_money,
          is_member_level_buy,
          is_need_subscript, 
          need_subscript_template,
          is_can_headsales,
          is_only_hexiao,
          hexiao_arr,
          hx_len,
          is_hide_details_count,
          goods_details_title_bg: res.data.goods_details_title_bg,
          needAuth: res.data.needauth
        }, () => {
          let goods_share_image = goods.goods_share_image;
          if (goods_share_image) {
            console.log('draw分享图');
            status.download(goods_share_image + "?imageView2/1/w/500/h/400").then(function (a) {
              that.goodsImg = a.tempFilePath, that.drawImgNoPrice();
            });
          } else {
            console.log('draw价格');
            let shareImg = goods.image_thumb;
            status.download(shareImg + "?imageView2/1/w/500/h/400").then(function (a) {
              that.goodsImg = a.tempFilePath, that.drawImg();
            });
          }
        })
        if (res.data.is_comunity_rest == 1) {
          wx.showModal({
            title: '温馨提示',
            content: `${that.data.groupInfo.owner_name}休息中，欢迎下次光临!`,
            showCancel: false,
            confirmColor: '#F75451',
            confirmText: '好的',
            success(res) { }
          })
        }
        let over_type = goods.over_type;
        var seconds = 0;
        if (over_type == 0) {
          seconds = (goods.begin_time - res.data.data.cur_time) * 1000;
        } else {
          seconds = (goods.end_time - res.data.data.cur_time) * 1000;
        }
        if (seconds > 0) {
          count_down(that, seconds);
        }
      }
    })
  },

  confrimChangeCommunity: function(){
    let community = this.data.changeCommunity;
    let token = wx.getStorageSync('token');
    app.globalData.community = community;
    app.globalData.changedCommunity = true;
    wx.setStorage({
      key: "community",
      data: community
    })
    token && util.addhistory(community);
    
    this.setData({ community, showChangeCommunity: false })
    this.get_goods_details(this.data.goods_id, community, community.communityId);
    console.log('用户点击确定')
  },

  cancelChangeCommunity: function() {
    let { is_can_headsales, groupInfo } = this.data;
    if(is_can_headsales==0) {
      app.util.message(`此商品在您所属${groupInfo.group_name}不可参与`, 'switchTo:/community/pages/index/index','error');
    }
    console.log('取消切换')
  },

  /**
   * 授权成功回调
   */
  authSuccess: function() {
    var id = this.$data.id;
    var scene = this.$data.scene;
    var community_id = this.$data.community_id;
    let url = '/community/pages/goods/goodsDetail?id=' + id + '&community_id=' + community_id + '&scene=' + scene+ '&type=' + this.data.buy_type;
    app.globalData.navBackUrl = url;
    let currentCommunity = wx.getStorageSync('community');
    let needPosition = this.data.needPosition;
    this.setData({ needAuth: false })
    if (currentCommunity) needPosition = false;
    needPosition || wx.redirectTo({ url })
  },

  authModal: function () {
    if (this.data.needAuth) {
      this.setData({ showAuthModal: !this.data.showAuthModal });
      return false;
    }
    return true;
  },

  /** 
   * 图片信息
   */
  imageLoad: function(e) {
    var imageSize = util.imageUtil(e)
    this.setData({
      imageSize
    })
  },

  /**
   * 获取服务信息
   */
  get_instructions: function() {
    let that = this;
    let goods_id = this.$data.id;
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'goods.get_instructions',
        goods_id
      },
      dataType: 'json',
      success: function(res) {
        if (res.data.code == 0) {
          var instructions = res.data.data.value;
          if (instructions == '') that.setData({ noIns: true })
          that.setData({
            instructions,
            index_bottom_image: res.data.data.index_bottom_image,
            goods_details_middle_image: res.data.data.goods_details_middle_image,
            is_show_buy_record: res.data.data.is_show_buy_record,
            order_notify_switch: res.data.data.order_notify_switch,
            is_show_comment_list: res.data.data.is_show_comment_list,
            goods_details_price_bg: res.data.data.goods_details_price_bg,
            isShowContactBtn: res.data.data.index_service_switch || 0,
            goods_industrial_switch: res.data.data.goods_industrial_switch || 0,
            goods_industrial: res.data.data.goods_industrial || '',
            is_show_ziti_time: res.data.data.is_show_ziti_time || 0,
            hide_community_change_btn: res.data.data.hide_community_change_btn || 0,
            is_show_goodsdetails_communityinfo: res.data.data.is_show_goodsdetails_communityinfo || 0
          })
        }
      }
    })
  },

  /**
   * 返回顶部
   */
  returnTop: function() {
    this.stickyFlag = false;
    this.setData({
      stickyFlag: false
    });
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 500
    });
  },

  /**
   * 加入购物车
   */
  addToCart: function(e) {
    if (!this.authModal()) return;
    var that = this;
    var from_id = e.detail.formId;
    var token = wx.getStorageSync('token');
    app.util.request({
      'url': 'entry/wxapp/user',
      'data': {
        controller: 'user.get_member_form_id',
        'token': token,
        "from_id": from_id
      },
      dataType: 'json',
      success: function(res) {}
    })
    that.setData({
      is_just_addcar: 1
    })

    //加入购物车
    that.openSku();
  },

  /**
   * 打开购物车
   */
  openSku: function(t=null) {
    if (!this.authModal()) return;
    var that = this;
    var is_just_addcar = this.data.is_just_addcar;
    if(t) {
      var e = t.detail;
      var goods_id = e.actId;
      var options = e.skuList;
      is_just_addcar = 1;
    } else {
      var goods_id = this.data.goods_id;
      var options = this.currentOptions;
    }

    that.setData({
      addCar_goodsid: goods_id
    })
    let list = options.list || [];
    let arr = [];
    if (list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        let sku = list[i]['option_value'][0];
        let temp = {
          name: sku['name'],
          id: sku['option_value_id'],
          index: i,
          idx: 0
        };
        arr.push(temp);
      }
      //把单价剔除出来begin
      var id = '';
      for (let i = 0; i < arr.length; i++) {
        if (i == arr.length - 1) {
          id = id + arr[i]['id'];
        } else {
          id = id + arr[i]['id'] + "_";
        }
      }
      var cur_sku_arr = options.sku_mu_list[id];

      that.setData({
        sku: arr,
        sku_val: 1,
        cur_sku_arr: cur_sku_arr,
        skuList: options,
        visible: true,
        showSku: true,
        is_just_addcar
      });
    } else {
      if(t) {
        let goodsInfo = e.allData;
        that.setData({
          sku: [],
          sku_val: 1,
          skuList: [],
          cur_sku_arr: goodsInfo,
          is_just_addcar
        })
        let formIds = {
          detail: {
            formId: ""
          }
        };
        formIds.detail.formId = "the formId is a mock one";
        that.gocarfrom(formIds);
      } else {
        let goods = this.data.goods;
        let card_price = goods.card_price || "0.00";
        let levelprice = goods.levelprice || "0.00";
        let cur_sku_arr = {
          canBuyNum: goods.total,
          spuName: goods.goodsname,
          actPrice: goods.actPrice,
          marketPrice: goods.marketPrice,
          stock: goods.total,
          skuImage: goods.image_thumb,
          card_price,
          levelprice
        }
        that.setData({
          sku: [],
          sku_val: 1,
          cur_sku_arr: cur_sku_arr,
          skuList: [],
          visible: true,
          showSku: true
        })
      }
    }
  },

  /**
   * 确认购物车
   */
  gocarfrom: function(e) {
    var that = this;
    var is_just_addcar = this.data.is_just_addcar;
    wx.showLoading();
    var token = wx.getStorageSync('token');

    app.util.request({
      'url': 'entry/wxapp/user',
      'data': {
        controller: 'user.get_member_form_id',
        'token': token,
        "from_id": e.detail.formId
      },
      dataType: 'json',
      success: function(res) {}
    })

    that.goOrder();
  },

  /**
   * 关闭购物车
   */
  closeSku: function() {
    this.setData({
      visible: 0,
      stopClick: false,
    });
  },

  goOrder: function() {
    var that = this;
    if (that.data.can_car) {
      that.data.can_car = false;
    }

    let open_man_orderbuy = this.data.open_man_orderbuy;
    if (open_man_orderbuy == 1 && this.data.is_just_addcar==0){
      let man_orderbuy_money = this.data.man_orderbuy_money*1;
      let sku_val = this.data.sku_val;
      let cur_sku_arr = this.data.cur_sku_arr;
      let actPrice = cur_sku_arr.actPrice[0] + '.' + cur_sku_arr.actPrice[1];
      console.log(actPrice * 1 * sku_val);
      if (actPrice * 1 * sku_val < man_orderbuy_money){
        wx.showToast({
          title: '满' + man_orderbuy_money + '元可下单！',
          icon: 'none'
        })
        return false;
      }
    }

    var token = wx.getStorageSync('token');
    var community = wx.getStorageSync('community');
    var goods_id = that.data.addCar_goodsid;
    var community_id = community.communityId;
    var quantity = that.data.sku_val;
    var cur_sku_arr = that.data.cur_sku_arr;
    var sku_str = '';
    var is_just_addcar = that.data.is_just_addcar;
    if (cur_sku_arr && cur_sku_arr.option_item_ids) {
      sku_str = cur_sku_arr.option_item_ids;
    }

    let buy_type = this.data.buy_type ? this.data.buy_type : 'dan';

    let data = {
      goods_id: goods_id,
      community_id,
      quantity,
      sku_str,
      buy_type,
      pin_id: 0,
      is_just_addcar
    }

    util.addCart(data).then(res=>{
      if(res.showVipModal==1) {
        let { pop_vipmember_buyimage } = res.data;
        wx.hideLoading();
        that.setData({ pop_vipmember_buyimage, showVipModal: true, visible: false })
      } else if (res.data.code == 3 || res.data.code == 7) {
        wx.showToast({
          title: res.data.msg,
          icon: 'none',
          duration: 2000
        })
      } else {
        if (buy_type =='integral'){
          // 积分
          if (res.data.code == 6) {
            var msg = res.data.msg;
            wx.showToast({
              title: msg,
              icon: 'none',
              duration: 2000
            })
          } else {
            //跳转结算页面
            wx.navigateTo({
              url: `/community/pages/order/placeOrder?type=integral`,
            })
          }
        }else {
          if (res.data.code == 4) {
            wx.hideLoading();
            that.setData({ needAuth: true, showAuthModal: true, visible: false })
          } else if (res.data.code == 6) {
            var msg = res.data.msg;
            let max_quantity = res.data.max_quantity || '';
            (max_quantity > 0) && that.setData({ sku_val: max_quantity })
            wx.showToast({
              title: msg,
              icon: 'none',
              duration: 2000
            })
          } else {
            if (is_just_addcar == 1) {
              that.closeSku();
              wx.showToast({
                title: "已加入购物车",
                image: "../../images/addShopCart.png"
              })
              app.globalData.cartNum = res.data.total
              that.setData({
                cartNum: res.data.total
              });
              status.indexListCarCount(goods_id);
            } else {
              var is_limit = res.data.is_limit_distance_buy;
  
              var pages_all = getCurrentPages();
              if (pages_all.length > 3) {
                wx.redirectTo({
                  url: '/community/pages/order/placeOrder?type=dan&is_limit=' + is_limit
                })
              } else {
                wx.navigateTo({
                  url: '/community/pages/order/placeOrder?type=dan&is_limit=' + is_limit
                })
              }
            }
  
          }
        }
      }
    }).catch(res=>{
      app.util.message(res||'请求失败', '', 'error');
    })
  },

  vipModal: function(t) {
    this.setData(t.detail)
  },

  selectSku: function(event) {
    var that = this;
    let str = event.currentTarget.dataset.type;
    let obj = str.split("_");
    let { sku, skuList, sku_val } = this.data;

    let temp = {
      name: obj[3],
      id: obj[2],
      index: obj[0],
      idx: obj[1]
    };
    sku.splice(obj[0], 1, temp);
    var id = '';
    for (let i = 0; i < sku.length; i++) {
      if (i == sku.length - 1) {
        id = id + sku[i]['id'];
      } else {
        id = id + sku[i]['id'] + "_";
      }
    }
    var cur_sku_arr = skuList.sku_mu_list[id];

    let h = {};
    sku_val = sku_val || 1;
    let canBuyNum = cur_sku_arr.canBuyNum;
    if(sku_val > canBuyNum) {
      h.sku_val = canBuyNum==0?1:canBuyNum;
      (canBuyNum>0) && wx.showToast({
        title: `最多只能购买${cur_sku_arr.canBuyNum}件`,
        icon: 'none'
      })
    }

    that.setData({
      cur_sku_arr,
      sku,
      ...h
    });

    console.log(id);
  },

  submit: function(e) {
    var from_id = e.detail.formId;
    var token = wx.getStorageSync('token');
    app.util.request({
      'url': 'entry/wxapp/user',
      'data': {
        controller: 'user.get_member_form_id',
        'token': token,
        "from_id": from_id
      },
      dataType: 'json',
      success: function(res) {}
    })


  },

  balance: function(e) {
    if (this.authModal()) {
      this.setData({
        is_just_addcar: 0
      })
      //加入购物车
      this.openSku();
    }
  },

  /**
   * 数量加减
   */
  setNum: function(event) {
    let types = event.currentTarget.dataset.type;
    var that = this;
    var num = 1;
    let sku_val = this.data.sku_val * 1;
    if (types == 'add') {
      num = sku_val + 1;
    } else if (types == 'decrease') {
      if (sku_val > 1) {
        num = sku_val - 1;
      }
    }

    let arr = that.data.sku;
    var options = this.data.skuList;
    if (arr.length > 0) {
      var id = '';
      for (let i = 0; i < arr.length; i++) {
        if (i == arr.length - 1) {
          id = id + arr[i]['id'];
        } else {
          id = id + arr[i]['id'] + "_";
        }
      }
    }
    if (options.length > 0) {
      var cur_sku_arr = options.sku_mu_list[id];
      if (num > cur_sku_arr['canBuyNum']) {
        num = num - 1;
      }
    } else {
      let cur_sku_arr = this.data.cur_sku_arr;
      if (num > cur_sku_arr['canBuyNum']) {
        num = num - 1;
      }
    }
    this.setData({
      sku_val: num
    })
  },

  scrollImagesChange: function(t) {
    this.videoContext && this.videoContext.pause();
    this.setData({
      fmShow: true,
      goodsIndex: t.detail.current + 1
    });
  },

  share_handler: function() {
    this.setData({
      is_share_html: false
    })
  },

  hide_share_handler: function() {
    this.setData({
      is_share_html: true
    })
  },

  share_quan: function() {
    if (!this.authModal()) return;
    wx.showLoading({
      title: '获取中',
    })
    var token = wx.getStorageSync('token');
    var community = wx.getStorageSync('community');

    var goods_id = this.data.order.goods_id;
    var community_id = community.communityId;

    var that = this;

    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'goods.get_user_goods_qrcode',
        token: token,
        community_id: community_id,
        goods_id: goods_id
      },
      dataType: 'json',
      success: function(res) {
        if (res.data.code == 0) {
          setTimeout(function() {
            wx.hideLoading()
          }, 2000)
          var image_path = res.data.image_path;
          wx.getImageInfo({
            src: image_path,
            success: function(res) {
              var real_path = res.path;
              wx.saveImageToPhotosAlbum({
                filePath: real_path,
                success(res) {
                  wx.showToast({
                    title: '图片保存成功，可以分享了',
                    icon: 'none',
                    duration: 2000
                  })
                  that.setData({
                    is_share_html: true
                  });
                }
              })
            }
          })
        } else {
          that.setData({
            needAuth: true
          })
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    let that = this;
    util.check_login_new().then((res) => {
      console.log('onShow', res)
      if(!res) {
        that.setData({
          needAuth: true
        })
      } else {
        (0, status.cartNum)('', true).then((res) => {
          res.code == 0 && that.setData({
            cartNum: res.data
          })
        });
      }
    })
    this.setData({
      stopNotify: false
    });
  },

  onReady: function (res) {
    this.videoContext = wx.createVideoContext('myVideo');
    this.coverVideoContext = wx.createVideoContext('coverVideo');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    this.setData({ stopNotify: true })
    console.log('详情页hide', this.data.stopNotify)
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    console.log('onUnload')
    this.setData({ stopNotify: true })
    console.log('详情页unload', this.data.stopNotify);
    detailClearTime = null;
    clearTimeout(detailClearTime);
  },

  /**
   * 获取分享图并显示
   * 20181225 新形式
   */
  get_share_img: function () {
    if (!this.authModal()) return;
    wx.showLoading();
    let shareImgUrl = this.data.shareImgUrl;
    if (shareImgUrl != '') {
      wx.hideLoading();
      this.setData({
        hideModal: false,
        is_share_html: true
      })
    } else {
      var token = wx.getStorageSync('token');
      var community = wx.getStorageSync('community');
      var goods_id = this.data.goods_id;
      var community_id = community.communityId;

      var that = this;
      app.util.request({
        url: 'entry/wxapp/index',
        data: {
          controller: 'goods.get_user_goods_qrcode',
          token: token,
          community_id: community_id,
          goods_id: goods_id
        },
        dataType: 'json',
        success: function (res) {
          if (res.data.code == 0) {
            wx.hideLoading();
            var image_path = res.data.image_path;
            wx.previewImage({
              current: image_path, // 当前显示图片的http链接
              urls: [image_path] // 需要预览的图片http链接列表
            })
          } else {
            that.setData({
              needAuth: true
            })
          }
        }
      })
    }
  },

  closeShareModal: function () {
    this.setData({ hideModal: true })
  },

  /**
   * 展开收起
   */
  bindOpen: function (t) {
    var idx = t.currentTarget.dataset.idx;
    console.log(idx)
    if (this.data.comment_list[idx].isOpen) {
      this.data.comment_list[idx].isOpen = false;
      var comment_list = this.data.comment_list;
      this.setData({
        comment_list: comment_list
      });
    } else {
      this.data.comment_list[idx].isOpen = true;
      var comment_list = this.data.comment_list;
      this.setData({
        comment_list: comment_list
      });
    }
  },

  /**
   * 保存分享图并显示
   * 20181225 新形式
   */
  saveThumb: function (e) {
    wx.showLoading();
    let that = this;
    var image_path = this.data.shareImgUrl;
    wx.getImageInfo({
      src: image_path,
      success: function (res) {
        var real_path = res.path;
        real_path && wx.saveImageToPhotosAlbum({
          filePath: real_path,
          success(res) {
            console.log(res)
            wx.hideLoading();
            wx.showToast({
              title: '已保存相册',
              icon: 'none',
              duration: 2000
            })
            that.setData({
              hideModal: true
            });
          },
          fail: function (res) {
            wx.hideLoading();
            console.log(res)
            if (res.errMsg === "saveImageToPhotosAlbum:fail:auth denied") {
              wx.openSetting({
                success(settingdata) {
                  if (settingdata.authSetting["scope.writePhotosAlbum"]) {
                    console.log("获取权限成功，再次点击图片保存到相册")
                  } else {
                    console.log("获取权限失败")
                  }
                }
              })
            }
          }
        })
      }
    })
  },

  drawImgNoPrice: function () {
    var t = this;
    wx.createSelectorQuery().select(".canvas-img").boundingClientRect(function () {
      const context = wx.createCanvasContext("myCanvas");
      context.drawImage(t.goodsImg, 0, 0, status.getPx(375), status.getPx(300));
      if (t.data.goods.video) context.drawImage("../../images/play.png", status.getPx(127.5), status.getPx(90), status.getPx(120), status.getPx(120));
      context.save();
      context.restore(), context.draw(false, t.checkCanvasNoPrice());
    }).exec();
  },

  checkCanvasNoPrice: function () {
    var that = this;
    setTimeout(() => {
      wx.canvasToTempFilePath({
        canvasId: "myCanvas",
        success: function (res) {
          res.tempFilePath ? that.imageUrl = res.tempFilePath : that.drawImgNoPrice();
          console.log('我画完了')
        },
        fail: function (a) {
          that.drawImgNoPrice();
        }
      })
    }, 500)
  },

  drawImg: function () {
    let endtime = this.data.endtime;
    let shareTime = (endtime.days > 0 ? endtime.days + '天' : '') + endtime.hours + ':' + endtime.minutes + ':' + endtime.seconds;
    var t = this;
    wx.createSelectorQuery().select(".canvas-img").boundingClientRect(function () {
      const context = wx.createCanvasContext("myCanvas");
      context.font = "28px Arial";
      if(t.data.buy_type=='integral') {
        var e = context.measureText(" ").width;
        var o = context.measureText(t.data.goods.price + "积分").width;
      } else {
        var e = context.measureText("￥").width + 2;
        var o = context.measureText(t.data.goods.price_front + "." + t.data.goods.price_after).width;
      }
      context.font = "17px Arial";
      var s = context.measureText("￥" + t.data.goods.productprice).width + 3,
        n = context.measureText("累计销售 " + t.data.goods.seller_count).width,
        u = context.measureText("· 剩余" + t.data.goods.total + " ").width + 10;
      context.font = "18px Arial";
      let over_type_text = t.data.goods.over_type == 0 ? '距开始' : '距结束';
      var r = context.measureText(over_type_text).width;
      var d = context.measureText(shareTime).width + 10;
      context.drawImage(t.goodsImg, 0, 0, status.getPx(375), status.getPx(300));
      context.drawImage("../../images/shareBottomBg.png", status.getPx(0), status.getPx(225), status.getPx(375), status.getPx(75));
      if (t.data.goods.video) context.drawImage("../../images/play.png", status.getPx(127.5), status.getPx(70), status.getPx(120), status.getPx(120));
      context.save();

      if(t.data.buy_type=='integral') {
        status.drawText(context, { color: "#ffffff", size: 28, textAlign: "left" }, t.data.goods.price + "积分",
        status.getPx(e), status.getPx(267), status.getPx(o));
      } else {
        status.drawText(context, { color: "#ffffff", size: 28, textAlign: "left" }, "￥", status.getPx(6), status.getPx(267), status.getPx(e));
        status.drawText(context, { color: "#ffffff", size: 28, textAlign: "left" }, t.data.goods.price_front + "." + t.data.goods.price_after,
        status.getPx(e), status.getPx(267), status.getPx(o));
      }
      context.restore();
      context.save();
      context.restore(),
      context.save(),
      (0, status.drawText)(context,
        { color: "#ffffff", size: 15, textAlign: "left" },
        "￥" + t.data.goods.productprice,
        (0, status.getPx)(e + o + 10),
        (0, status.getPx)(267),
        (0, status.getPx)(s)
      ),
      context.restore(),
      context.save(),
      (0, status.drawText)(
        context,
        { color: "#ffffff", size: 17, textAlign: "left" },
        "累计销售" + t.data.goods.seller_count,
        (0, status.getPx)(10),
        (0, status.getPx)(290),
        (0, status.getPx)(n)
      ),
      context.restore(),
      context.save(),
      (0, status.drawText)(context,
        { color: "#ffffff", size: 17, textAlign: "left" },
        "· 剩余" + t.data.goods.total,
        (0, status.getPx)(n + 10),
        (0, status.getPx)(290),
        (0, status.getPx)(u)
      ),
      context.restore(),
      context.save(),
      context.beginPath(),
      context.setStrokeStyle("white"),
      context.moveTo((0, status.getPx)(e + o + 10),
        (0, status.getPx)(261)),
      context.lineTo((0, status.getPx)(e + o + s + 15),
        (0, status.getPx)(261)),
      context.stroke(),
      context.restore(),
      context.save(),
      (0, status.drawText)(context,
        { color: "#F8E71C", size: 18, textAlign: "center" },
        over_type_text,
        (0, status.getPx)(318),
        (0, status.getPx)(260),
        (0, status.getPx)(r)
      ),
      context.restore(),
      context.save(),
      (0, status.drawText)(context, { color: "#F8E71C", size: 18, textAlign: "center" },
        shareTime,
        (0, status.getPx)(315),
        (0, status.getPx)(288),
        (0, status.getPx)(d)
      ),
      context.restore();
      context.draw(false, t.checkCanvas());
    }).exec();
  },
  
  checkCanvas: function () {
    var that = this;
    setTimeout(() => {
      wx.canvasToTempFilePath({
        canvasId: "myCanvas",
        success: function (res) {
          res.tempFilePath ? that.imageUrl = res.tempFilePath : that.drawImg();
          console.log('我画完了')
        },
        fail: function (a) {
          that.drawImg();
        }
      })
    }, 500)
  },

  previewImg: function(e){
    let idx = e.currentTarget.dataset.idx || 0;
    let prevImgArr = this.data.prevImgArr;
    wx.previewImage({
      current: prevImgArr[idx],
      urls: prevImgArr
    })
  },

  /**
   * 播放视频隐藏封面图
   */
  btnPlay: function () {
    this.setData({
      fmShow: false
    })
    this.videoContext.play();
  },

  videEnd: function(){
    this.videoContext.exitFullScreen();
    this.setData({
      fmShow: true
    })
  },

  endPlay: function(){
    this.videoContext.pause();
    this.setData({
      fmShow: true
    })
  },

  // 显示群主二维码
  showGroupCode: function(){
    let group_share_info = this.data.group_share_info;
    let imgUrl = group_share_info.share_wxcode || '';
    if(imgUrl) {
      wx.previewImage({
        current: imgUrl, // 当前显示图片的http链接
        urls: [imgUrl] // 需要预览的图片http链接列表
      })
    } else {
      wx.showModal({
        title: "提示",
        content: "未设置联系方式，请联系管理员",
        showCancel: false
      })
    }
  },

  changeCommunity: function() {
    if (this.data.hide_community_change_btn==0) {
      var id = this.$data.id;
      var scene = this.$data.scene;
      var community_id = this.$data.community_id;
      let url = '/community/pages/goods/goodsDetail?id=' + id + '&community_id=' + community_id + '&scene=' + scene;
      app.globalData.navBackUrl = url;
      wx.redirectTo({
        url: '/community/pages/position/community',
      })
    }
  },

  changeCartNum: function (t) {
    let that = this;
    let e = t.detail;
    (0, status.cartNum)(that.setData({ cartNum: e }));
  },

  goLink: function (event) {
    if (!this.authModal()) return;
    let link = event.currentTarget.dataset.link;
    var pages_all = getCurrentPages();
    if (pages_all.length > 3) {
      wx.redirectTo({
        url: link
      })
    } else {
      wx.navigateTo({
        url: link
      })
    }
  },

  // 输入框获得焦点
  handleFocus: function () {
    this.focusFlag = true;
  },

  handleBlur: function (t) {
    let a = t.detail;
    let val = parseInt(a.value);
    if (val == '' || isNaN(val)) {
      this.setData({ sku_val: 1 })
    }
  },

  // 监控输入框变化
  changeNumber: function (t) {
    let { cur_sku_arr, sku_val } = this.data;
    let max = cur_sku_arr.stock * 1;
    let a = t.detail;
    this.focusFlag = false;
    if (a) {
      let val = parseInt(a.value);
      val = val < 1 ? 1 : val;
      if (val > max) {
        wx.showToast({
          title: `最多只能购买${max}件`,
          icon: 'none'
        })
        sku_val = max;
      } else {
        sku_val = val;
      }
    }
    this.setData({ sku_val })
  },

  handleHexiaoModal: function() {
    this.setData({
      showHexiaoModal: !this.data.showHexiaoModal
    })
  },

  coverVideoEnd: function(){
    this.setData({
      showCoverVideo: false
    })
  },

  closeCoverVideo: function(){
    this.coverVideoContext.pause();
    this.setData({
      showCoverVideo: false
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    var community = wx.getStorageSync('community');
    let { goods_id, buy_type } = this.data;
    var community_id = community.communityId;
    var share_title = this.data.share_title;
    var share_id = wx.getStorageSync('member_id');
    var share_path = 'community/pages/goods/goodsDetail?id=' + goods_id + '&share_id=' + share_id + '&community_id=' + community_id + '&type=' + buy_type;
    let shareImg = this.data.goods.goods_share_image;
    console.log('商品分享地址：');
    console.log(share_path);
    
    var that = this;
    that.setData({is_share_html: true, hideModal: true, hideCommissInfo: true})
    setTimeout(()=>{
      this.setData({
        hideCommissInfo: false
      })
    }, 1000)
    return {
      title: share_title,
      path: share_path,
      imageUrl: shareImg ? shareImg : that.imageUrl,
      success: function(res) {
        // 转发成功
      },
      fail: function(res) {
        // 转发失败
      }
    }

  }
})