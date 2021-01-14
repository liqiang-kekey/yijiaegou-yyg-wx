var util = require('../../utils/util.js');
var status = require('../../utils/index.js');
var a = require("../../utils/public");
var countDownInit = require("../../utils/countDown");
var wcache = require('../../utils/wcache.js');
var app = getApp();
var timerOut = '';
Page({
  mixins: [countDownInit.default, require('../../mixin/globalMixin.js')],
  data: {
    needAuth: false,
    stopClick: false,
    community: {},
    rushList: [],
    commingList: [],
    countDownMap: [],
    actEndMap: [],
    skuList: [],
    pageNum: 1,
    notice_list: [],
    slider_list: [],
    shop_info: {},
    showEmpty: false,
    indexBottomImage: '',
    classification: {
      tabs: [],
      activeIndex: -1
    },
    commingClassification: {
      tabs: [],
      activeIndex: -1
    },
    isShowCommingClassification: true,
    isShowClassification: true,
    showChangeCommunity: false,
    isTipShow: false,
    isShowGuide: false,
    index_lead_image: '',
    theme: 0,
    cartNum: 0,
    navigat: [],
    tabIdx: 0,
    scrollDirect: "",
    isSticky: false,
    showCommingEmpty: false,
    stopNotify: true,
    reduction: {},
    is_share_html: true,
    commingNum: 0,
    couponRefresh: false,
    index_change_cate_btn: 0,
    newComerRefresh: false,
    showCouponModal: false,
    copy_text_arr: [],
    showCopyText: false,
    totalAlertMoney: 0,
    groupInfo: {
      group_name: '社区',
      owner_name: '团长'
    },
    needPosition: true,
    typeTopicList: [],
    pinList: {},
    cube: [],
    secRushList: [],
    secKillGoodsIndex: 1,
    isblack: 0,
    imageSize: {
      imageWidth: "100%",
      imageHeight: 600
    },
    fmShow: true,
    //
    zb_roomid:0,
    zb_status:false,
    //用户是否登录
    b_userlogin:false,
    checkLoginInterval:null,
    //首页广告是否已开启
    showShopModal:false,
    //首页广告是否显示，登录后才显示
    hasAlartShopModal:false,
    showShopTitle: '',
    showShopImg:'',
    showShopLinkUrl:'',
    showSignModal:true
  },
  isFirst: 0,
  $data: {
    stickyFlag: false,
    scrollTop: 0,
    overPageNum: 1,
    loadOver: false,
    hasOverGoods: false,
    countDownMap: {},
    actEndMap: {},
    timer: {},
    scrollHeight: 1300,
    stickyTop: 0,
    hasCommingGoods: true
  },
  tpage: 1,
  hasRefeshin: false,
  postion: {},
  options: '',
  focusFlag: false,
/**/

  /**
   * 监控滚动事件
   */
  onPageScroll: function (t) {
    //
    if (!this.$data.isLoadData) {
      if (t.scrollTop < this.$data.scrollHeight) {
        if (t.scrollTop > this.$data.scrollTop) {
          "down" !== this.data.scrollDirect && this.setData({
            scrollDirect: "down"
          })
        } else {
          "up" != this.data.scrollDirect && this.setData({
            scrollDirect: "up"
          })
        }
      } else {
        "down" !== this.data.scrollDirect && this.setData({
          scrollDirect: "down"
        })
      }
      if (t.scrollTop > this.$data.stickyTop) {
        this.data.isSticky || (this.setData({
          isSticky: true
        }), this.$data.stickyFlag = true)
      } else {
        t.scrollTop < this.$data.stickyBackTop && this.data.isSticky && (this.setData({
          isSticky: false
        }), this.$data.stickyFlag = false)
      }
      this.$data.scrollTop = t.scrollTop
    }
  },

  onLoad: function(options) {
    wx.getLogManager();
    console.log('options', options);
    wx.hideTabBar();
    var that = this;
    var token = wx.getStorageSync('token');
    status.setNavBgColor();
    status.setGroupInfo().then((groupInfo) => { that.setData({ groupInfo }) });
    console.log('step1');
    let community = wx.getStorageSync('community');
    let community_id = community.communityId || '';

    if (options && Object.keys(options).length != 0) {
      console.log('step2');
      var scene = decodeURIComponent(options.scene);
      if (scene != 'undefined') {
        var opt_arr = scene.split("_");
        options.community_id = opt_arr[0];
        wcache.put('share_id', opt_arr[1]);
      }
      that.options = options;

      if (options.share_id != 'undefined' && options.share_id > 0) wcache.put('share_id', options.share_id);
      console.log("options.community_id=" + options.community_id);
      if (options.community_id != 'undefined' && options.community_id > 0) {
        console.log('step3');
        util.getCommunityById(options.community_id).then((res)=>{
          if (res.code == 0) {
            console.log('step4');
            var shareCommunity = res.data;
            console.log('分享community_id', options.community_id);
            console.log('历史community_id', community_id);
            let sdata = {};
            if (res.open_danhead_model == 1) {
              console.log('开启单社区', res.default_head_info);
              sdata.community = res.default_head_info;
              sdata.open_danhead_model = res.open_danhead_model;
              token && that.addhistory(res.default_head_info.communityId || '');
              wx.setStorageSync('community', res.default_head_info);
            } else if (shareCommunity){
              if (options.community_id != community_id) {
                if (community_id) {
                  sdata.showChangeCommunity = true;
                  sdata.changeCommunity = shareCommunity;
                  sdata.community = community;
                } else {
                  sdata.community = shareCommunity;
                  sdata.shareCommunity = shareCommunity;
                  wcache.put('community', shareCommunity);
                }
              } else {
                sdata.community = community;
              }
            }
            sdata.hidetip = false;
            sdata.token = token;
            sdata.showEmpty = false;
            sdata.needPosition = false;
            that.setData(sdata, ()=>{
              that.loadPage();
            });
          } else {
            console.log('step5');
            that.loadPage();
            that.setData({
              hidetip: false,
              token: token,
              showEmpty: false,
              needPosition: false
            })
          }
          token && that.addhistory();
        })
      } else {
        util.getCommunityById(options.community_id).then((res) => {
          if (res.code == 0) {
            if (res.open_danhead_model == 1) {
              console.log('开启单社区step6');
              that.setData({ community: res.default_head_info, open_danhead_model: res.open_danhead_model })
              token && that.addhistory(res.default_head_info.communityId || '');
              wx.setStorageSync('community', res.default_head_info);
            }
            console.log('step6');
            that.loadPage();
          }
        }).catch(() => {
          that.loadPage();
        })
      }
    } else {
      util.getCommunityById(options.community_id).then((res) => {
        if (res.code == 0) {
          if (res.open_danhead_model == 1) {
            console.log('开启单社区step7');
            that.setData({ community: res.default_head_info, open_danhead_model: res.open_danhead_model })
            token && that.addhistory(res.default_head_info.communityId || '');
            wx.setStorageSync('community', res.default_head_info);
          }
          that.loadPage();
        }
      }).catch(()=>{
        that.loadPage();
      })
      console.log('step7');
      that.setData({
        hidetip: false,
        token: token,
        showEmpty: false,
        community
      })
    }
    //
    let roomId = [2];
    let customParams = encodeURIComponent(JSON.stringify({ path: 'pages/index/index', pid: 1 })) 
    // 开发者在直播间页面路径上携带自定义参数（如示例中的path和pid参数），
    //后续可以在分享卡片链接和跳转至商详页时获取，详见【获取自定义参数】、【直播间到商详页面携带参数】章节（上限600个字符，超过部分会被截断）
    that.setData({
        roomId,
        customParams
    })
    //
    this.data.checkLoginInterval = setInterval(this.checkLogin, 5000);
    //setTimeout(this.checkLogin, 1000);
    this.getShopModel();
  },
  //
  //判断用户是否登录
  checkLogin() {
    if (!this.authModal()) {
      return;
    }else {
      clearInterval(this.data.checkLoginInterval);
      this.setData({hasAlartShopModal:true});
    }
  },
  //
  addhistory: function (id=0) {
    console.log('step13');
    let community_id = 0;
    if (id==0) {
      var community = wx.getStorageSync('community');
      community_id = community.communityId;
    } else {
      community_id = id;
    }
    console.log('history community_id=' + community_id);
    var token = wx.getStorageSync('token');
    let that = this;
    community_id !==void 0 && app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'index.addhistory_community',
        community_id: community_id,
        'token': token
      },
      dataType: 'json',
      success: function(res) {
        if(id!=0) that.getHistoryCommunity(), console.log('addhistory+id', id);
      }
    })
  },

  loadPage: function() {
    wx.showLoading();
    console.log('step8');
    let that = this;
    that.get_index_info();
    that.get_type_topic();
    that.getNavigat();
    that.getCoupon();
    that.getPinList();
    //
    that.getZhiboInfo();

    status.loadStatus().then(function() {
      let appLoadStatus = app.globalData.appLoadStatus;
      console.log('appLoadStatus',appLoadStatus);
      console.log('needAuth',app.globalData.isAuthModel);
      if(app.globalData.isAuthModel) {
        that.setData({ needAuth: false })
      } else {
        that.setData({ needAuth: true, couponRefresh: false , hasAlartShopModal: false});
      }

      if (appLoadStatus == 0) {
        // wx.hideLoading();
        setTimeout(function(){ wx.hideLoading(); },1000);
        that.setData({ needAuth: true, couponRefresh: false, hasAlartShopModal: false });
        that.load_goods_data();
      } else if (appLoadStatus == 2) {
        console.log('step9');
        that.getHistoryCommunity();
      } else {
        console.log('step12');
        let community = wx.getStorageSync('community');
        community || (community=app.globalData.community);
        if (!community){
          util.getCommunityInfo().then((res) => {
            that.setData({
              community: that.fliterCommunity(res)
            })
          })
        } else {
          that.setData({
            community: that.fliterCommunity(community)
          })
        }
        console.log('step18');
        that.load_goods_data();
      }
    });
  },

  // 不显示社区省份
  fliterCommunity: function (community){
    let resArr = community && community.fullAddress && community.fullAddress.split('省');
    if (resArr) {
      return Object.assign({}, community, { address: resArr[1] || resArr[0] });
    } else {
      return community;
    }
  },

  onReady: function (res) {
    this.videoContext = wx.createVideoContext('myVideo');
  },

  onShow: function() {
    // 页面显示
        util.check_login_new().then(isLogin=>{
      if(isLogin) {
        that.setData({ needAuth: false })
      } else {
        that.setData({ needAuth: true, couponRefresh: false , hasAlartShopModal: false});
      }
    });
    let that = this;
    console.log('isblack', app.globalData.isblack)
    this.setData({ stopNotify: false, tabbarRefresh: true, isblack: app.globalData.isblack || 0 })
    app.globalData.timer.start();
    (0, status.cartNum)('', true).then((res)=>{
      res.code == 0 && that.setData({ cartNum: res.data })
    });

    if (app.globalData.changedCommunity) {
      console.log('change')
      app.globalData.goodsListCarCount = [];
      let community = app.globalData.community;
      this.setData({
        community: that.fliterCommunity(community),
        newComerRefresh: false
      });
      this.getCommunityPos(community.communityId);
      this.hasRefeshin = false;
      this.setData({
        newComerRefresh: true,
        rushList: [],
        pageNum: 1,
        classificationId: null,
        "classification.activeIndex": -1
      }, () => {
        this.setData({
          "classification.activeIndex": 0
        })
      })
      this.$data = {
        ...this.$data, ...{
          overPageNum: 1,
          loadOver: false,
          hasOverGoods: false,
          countDownMap: {},
          actEndMap: {},
          timer: {},
          stickyFlag: false,
          hasCommingGoods: true
        }
      }
      app.globalData.changedCommunity = false, this.get_index_info(), this.addhistory();
      this.load_goods_data(), this.get_type_topic(),this.getPinList();
    } else {
      console.log('nochange')
      if (that.isFirst>=1){
        this.setData({ loadOver: true })
        this.changeRushListNum();
      }
    }

    if (that.isFirst==0) {
      this.setData({ couponRefresh: true });
    } else {
      this.getCoupon();
    }
    that.isFirst++;
  },

  /**
   * 动态变化列表购物车数量
   */
  changeRushListNum: function(){
    let goodsListCarCount = app.globalData.goodsListCarCount;
    let rushList = this.data.rushList;
    let changeCarCount = false;
    this.setData({ changeCarCount })
    if (goodsListCarCount.length > 0 && rushList.length > 0) {
      goodsListCarCount.forEach(function (item) {
        let k = rushList.findIndex((n) => n.actId == item.actId);
        if (k != -1 && rushList[k].skuList.length === 0) {
          let newNum = item.num * 1;
          rushList[k].car_count = newNum >= 0 ? newNum : 0;
          changeCarCount = true;
        }
      })
      this.setData({ rushList, changeCarCount })
    }
  },

  changeNotListCartNum: function (t) {
    let that = this;
    let e = t.detail;
    (0, status.cartNum)(that.setData({ cartNum: e }));
    this.changeRushListNum();
  },

  onHide: function() {
    this.setData({ stopNotify: true, tabbarRefresh: false, changeCarCount: false })
    console.log('详情页', this.data.stopNotify)
    app.globalData.timer.stop();
    console.log('onHide')
  },

  /**
   * 授权成功回调
   */
  authSuccess: function() {
    console.log('authSuccess');
    let that = this;
    this.tpage = 1;
    this.hasRefeshin = false;
    this.setData({
      rushList: [],
      pageNum: 1,
      needAuth: false,
      newComerRefresh: false,
      couponRefresh: true,
      hasAlartShopModal: true,
      isblack: app.globalData.isblack || 0
    })
    this.$data = {
      ...this.$data, ...{
        overPageNum: 1,
        loadOver: false,
        hasOverGoods: false,
        countDownMap: {},
        actEndMap: {},
        timer: {},
        hasCommingGoods: true
      }
    }
    status.getInNum().then((isCan) => {
      if (isCan) {
        that.setData({ isTipShow: true })
        timerOut = setTimeout(() => { that.setData({ isTipShow: false }) }, 7000);
      }
    })
    this.loadPage();
    this.data.isTipShow && (timerOut = setTimeout(() => { that.setData({ isTipShow: false }) }, 7000));
  },

  authModal: function (e = {}) {
    let needAuth = (e && e.detail) || this.data.needAuth;
    if (this.data.needAuth || e.detail) {
      this.setData({
        showAuthModal: !this.data.showAuthModal,
        needAuth
      });
      return false;
    }
    return true;
  },

  //获取历史社区
  getHistoryCommunity: function () {
    let that = this;
    var token = wx.getStorageSync('token');
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'index.load_history_community',
        token: token
      },
      dataType: 'json',
      success: function (res) {
        console.log('step14');
        if (res.data.code == 0) {
          console.log('getHistoryCommunity');
          let history_communities = res.data.list;
          let isNotHistory = false;
          if (Object.keys(history_communities).length == 0 || history_communities.communityId == 0) isNotHistory = true;
          
          let resArr = history_communities && history_communities.fullAddress && history_communities.fullAddress.split('省');
          history_communities = Object.assign({}, history_communities, { address: resArr[1] })

          that.setData({
            community: history_communities
          })
          wcache.put('community', history_communities);
          app.globalData.community = history_communities;

          if (token && !isNotHistory) {
            let lastCommunity = wx.getStorageSync('lastCommunity');
            let lastCommunityId = lastCommunity.communityId || '';
            if (lastCommunityId != '' && lastCommunityId != history_communities.communityId) {
              that.setData({
                showChangeCommunity: true,
                changeCommunity: lastCommunity
              }, ()=> {
                wx.removeStorageSync('lastCommunity');
              })
            }
          }

          that.setData({
            community: app.globalData.community
          })
          that.load_goods_data();
        } else {
          let options = that.options;
          if (options !== void 0 && options.community_id) {
            console.log('新人加入分享进来的社区id:', that.options);
            that.addhistory(options.community_id);
          } else if (res.data.code == 1) {
            console.log('获取历史社区');
            wx.redirectTo({
              url: "/community/pages/position/community"
            })
          } else {
            that.setData({ needAuth: true })
          }
        }
      }
    })
  },
  
  getScrollHeight: function () {
    wx.createSelectorQuery().select('.rush-list-box').boundingClientRect((rect) => {
      rect && rect.height && (this.$data.scrollHeight = rect.height || 1300);
      console.log(this.$data.scrollHeight)
    }).exec()
  },

  /**
   * 引导页切换
   */
  handleProxy: function(){
    clearTimeout(timerOut);
    this.setData({
      isTipShow: false,
      isShowGuide: true
    })
    wcache.put('inNum', 4);
  },

  handleHideProxy: function(){
    this.setData({
      isTipShow: false,
      isShowGuide: false
    })
  },

  /**
   * 获取首页信息
   */
  get_index_info: function() {
    let that = this;
    let community = wx.getStorageSync('community');
    let communityId = community && community.communityId || '';
    let token = wx.getStorageSync('token');
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'index.index_info',
        communityId,
        token
      },
      dataType: 'json',
      success: function(res) {
        let rdata = res.data;
        let groupInfo = that.data.groupInfo;
        console.log(rdata);
        if (rdata.code == 0) {
          if (!res.data.is_community && communityId && !that.data.needAuth) {
            let changeCommunity = that.data.changeCommunity || {};
            let changeCommunityId = changeCommunity.communityId || '';
            if (changeCommunityId) {
              wcache.put('community', changeCommunity);
              that.addhistory(changeCommunity.community_id);
              that.setData({
                community: changeCommunity,
                showChangeCommunity: false
              })
              that.loadPage();
            } else {
              wx.showModal({
                title: '提示',
                content: `该${groupInfo.group_name}不在，请重新选择${groupInfo.group_name}`,
                showCancel: false,
                confirmColor: '#F75451',
                success(res) {
                  if (res.confirm) {
                    wx.redirectTo({
                      url: '/community/pages/position/community',
                    })
                  }
                }
              })
            }
          }
          let notice_list = rdata.notice_list;
          let slider_list = rdata.slider_list;
          let index_lead_image = rdata.index_lead_image;
          if(index_lead_image){
            status.getInNum().then((isCan)=>{
              if (isCan) {
                that.setData({ isTipShow: true },()=>{
                  timerOut = setTimeout(() => { that.setData({ isTipShow: false }) }, 9000);
                })
              }
            })
          } else {
            that.setData({ isTipShow: false })
          }

          let common_header_backgroundimage = rdata.common_header_backgroundimage;
          app.globalData.common_header_backgroundimage = common_header_backgroundimage;
          let order_notify_switch = rdata.order_notify_switch;
          let index_list_top_image_on = rdata.index_list_top_image_on || 1;
          let index_change_cate_btn = rdata.index_change_cate_btn || 0;
          let default_img = '../../images/rush-title.png';
          if (index_list_top_image_on == 1) default_img='';
          let index_list_top_image = rdata.index_list_top_image ? rdata.index_list_top_image : default_img;
          let shop_info = {
            shoname: rdata.shoname,
            shop_index_share_image: rdata.shop_index_share_image,
            index_list_top_image: index_list_top_image,
            title: rdata.title,
            common_header_backgroundimage,
            order_notify_switch,
            index_top_img_bg_open: rdata.index_top_img_bg_open || 0,
            index_top_font_color: rdata.index_top_font_color || '#fff',
            index_communityinfo_showtype: rdata.index_communityinfo_showtype || 0,
            nav_bg_color:rdata.nav_bg_color,
            index_header_text_backgroundimage:rdata.index_header_text_backgroundimage,
            index_header_zhibo_image:rdata.index_header_zhibo_image
          }
          app.globalData.placeholdeImg = rdata.index_loading_image || '';
          let placeholdeImg = rdata.index_loading_image || '';

          wcache.put('shopname', rdata.shoname);
          wx.setNavigationBarTitle({ title: rdata.shoname });

          let category_list = rdata.category_list || [];
          let index_type_first_name = rdata.index_type_first_name || '全部';
          if (category_list.length > 0) {
            category_list.unshift({
              name: index_type_first_name,
              id: 0
            });
            //将商品分类按照分组start
            var classificationList = [];
            var classificationItem = [];
            var classifiNumber = 3;//产品分类分组显示数量
            if(rdata.is_show_goods_classify_number != undefined && rdata.is_show_goods_classify_number != 0){
              classifiNumber = rdata.is_show_goods_classify_number;
            }
            category_list.forEach((item, idx) => {
              if(item.id != 0){
                classificationItem.push(item);
                if(classificationItem.length == classifiNumber){
                  classificationList.push(classificationItem);
                  classificationItem = new Array();
                }else if(idx + 1 == category_list.length && classificationItem.length > 0 ){
                  for(var i = 0 ; i <= classifiNumber - classificationItem.length; i++){
                    classificationItem.push([]);
                  }
                  classificationList.push(classificationItem);
                }else{
                }
              }
            });
            //将商品分类按照分组end
            that.setData({
              isShowClassification: true,
              "classification.tabs": category_list,
              "classificationList": classificationList
            })
          } else {
            that.setData({
              isShowClassification: false
            })
          }

          let theme = rdata.theme || 0;
          let rushEndTime = rdata.rushtime*1000 || 0;
          let isShowShareBtn = rdata.index_share_switch || 0;
          let isShowListCount = rdata.is_show_list_count || 0;
          let isShowListTimer = rdata.is_show_list_timer || 0;
          let isShowContactBtn = rdata.index_service_switch || 0; 
          let index_switch_search = rdata.index_switch_search || 0;
          let ishow_index_gotop = rdata.ishow_index_gotop || 0;

          if (rdata.is_comunity_rest == 1 && !that.data.needAuth) {
            wx.showModal({
              title: '温馨提示',
              content: `${groupInfo.owner_name}休息中，欢迎下次光临!`,
              showCancel: false,
              confirmColor: '#F75451',
              confirmText: '好的',
              success(res) { }
            })
          }

          that.postion = rdata.postion;

          //秒杀
          let { scekill_time_arr, seckill_bg_color, seckill_is_open, seckill_is_show_index, hide_community_change_word,index_qgtab_counttime, hide_index_type } = rdata;
          let myDate = new Date();
          let curHour = myDate.getHours(); // 当前时间
          console.log('当前时间:', curHour);
          let curSeckillIdx = 0; //当前时间索引
          let scekillTimeArr = []; //显示的时间段
          if (scekill_time_arr.length > 3) {
            let timeLen = scekill_time_arr.length;
            curSeckillIdx = scekill_time_arr.findIndex(item => {
              return item >= curHour;
            });
            console.log('当前时间索引:', curSeckillIdx)
            //取三个时间段
            if (curSeckillIdx === -1) {
              //没有进行或者未开始 取最后三个
              scekillTimeArr = scekill_time_arr.slice(-3);
            } else if (curSeckillIdx === 0) {
              //全部未开始 取最前三个
              scekillTimeArr = scekill_time_arr.slice(0, 3);
            } else if ((curSeckillIdx + 1) == timeLen) {
              //剩最后一个 取最后三个
              scekillTimeArr = scekill_time_arr.slice(-3);
            } else {
              scekillTimeArr = scekill_time_arr.slice(curSeckillIdx - 1, curSeckillIdx + 2);
            }
          } else {
            scekillTimeArr = scekill_time_arr;
          }
          //判断各个时段状态
          let scekillTimeList = [];
          let secKillActiveIdx = 0;
          if(scekillTimeArr.length){
            scekillTimeArr.forEach((item, idx) => {
              let secObj = {};
              //state: 0已开抢 1疯抢中 2即将开抢
              if (item == curHour) {
                secObj.state = 1;
                secObj.desc = '疯抢中';
                secKillActiveIdx = idx;
              } else if (item < curHour) {
                secObj.state = 0;
                secObj.desc = '已开抢';
              } else {
                secObj.state = 2;
                secObj.desc = '即将开抢';
              }
              secObj.timeStr = (item < 10 ? '0' + item : item) + ':00';
              secObj.seckillTime = item;
              scekillTimeList.push(secObj);
            })
            //获取当前秒杀商品
            that.getSecKillGoods(scekillTimeArr[secKillActiveIdx]);
          }

          let index_video_arr = rdata.index_video_arr;
          that.setData({
            notice_list,
            slider_list,
            index_lead_image,
            theme,
            indexBottomImage: rdata.index_bottom_image || '',
            shop_info: shop_info,
            loadOver: true,
            rushEndTime,
            commingNum: rdata.comming_goods_total,
            isShowShareBtn,
            isShowListCount,
            isShowListTimer,
            is_comunity_rest: rdata.is_comunity_rest,
            index_change_cate_btn,
            isShowContactBtn,
            index_switch_search,
            is_show_new_buy: rdata.is_show_new_buy || 0,
            qgtab: res.data.qgtab || {},
            notice_setting: rdata.notice_setting || {},
            index_hide_headdetail_address: rdata.index_hide_headdetail_address || 0,
            is_show_spike_buy: rdata.is_show_spike_buy || 0,
            hide_community_change_btn: rdata.hide_community_change_btn || 0,
            hide_top_community: rdata.hide_top_community || 0,
            index_qgtab_text: rdata.index_qgtab_text,
            ishow_index_copy_text: rdata.ishow_index_copy_text || 0,
            newComerRefresh: true,
            cube: rdata.cube,
            placeholdeImg,
            seckill_bg_color,
            seckill_is_open,
            seckill_is_show_index,
            scekillTimeList,
            secKillActiveIdx,
            hide_community_change_word,
            ishow_index_gotop,
            ishow_index_pickup_time: rdata.ishow_index_pickup_time || 0,
            index_video_arr,
            index_qgtab_counttime,
            hide_index_type,
            show_index_wechat_oa: rdata.show_index_wechat_oa,
            ishide_index_goodslist: rdata.ishide_index_goodslist
          })
        }
      }
    })
  },

  /**
   * 确认切换社区
   */
  confrimChangeCommunity: function() {
    let community = this.data.changeCommunity;
    app.globalData.community = community;
    wcache.put('community', community);
    this.$data = {
      ...this.$data, ...{
        overPageNum: 1,
        loadOver: false,
        hasOverGoods: false,
        countDownMap: {},
        actEndMap: {},
        timer: {},
        stickyFlag: false
      }
    }
    this.hasRefeshin = false;
    this.setData({
      showChangeCommunity: false,
      community: community,
      rushList: [],
      pageNum: 1
    }, () => {
      this.loadPage();
      this.addhistory();
    })
  },

  /**
   * 关闭切换社区
   */
  closeChangeCommunity: function(){
    this.setData({
      showChangeCommunity: false
    })
  },

  /**
   * 获取商品列表
   */
  load_goods_data: function() {
    var token = wx.getStorageSync('token');
    var that = this;
    var cur_community = wx.getStorageSync('community');
    var gid = that.data.classificationId;
    this.$data.isLoadData = true;
    console.log('load_goods_begin ');

    if (!that.hasRefeshin && !that.$data.loadOver) {
      console.log('load_goods_in ');
      this.hasRefeshin = true;
      that.setData({
        loadMore: true
      });
      app.util.request({
        'url': 'entry/wxapp/index',
        'data': {
          controller: 'index.load_gps_goodslist',
          token: token,
          pageNum: that.data.pageNum,
          head_id: cur_community.communityId,
          gid,
          per_page: 12
        },
        dataType: 'json',
        success: function(res) {
          if (that.data.pageNum == 1) {
            that.setData({ cate_info: res.data.cate_info || {} })
          }
          if (res.data.code == 0) {
            let rushList = '';
            if (res.data.is_show_list_timer==1) {
              rushList = that.transTime(res.data.list);
              for (let s in that.$data.countDownMap) that.initCountDown(that.$data.countDownMap[s]);
            } else {
              let oldRushList = that.data.rushList;
              rushList = oldRushList.concat(res.data.list);
            }
            let rdata = res.data;
            let { full_money, full_reducemoney, is_open_fullreduction, is_open_vipcard_buy, is_vip_card_member, is_member_level_buy } = rdata;
            let reduction = { full_money, full_reducemoney, is_open_fullreduction }

            // 是否可以会员折扣购买
            let canLevelBuy = false;
            if (is_open_vipcard_buy == 1) {
              if (is_vip_card_member != 1 && is_member_level_buy == 1) canLevelBuy = true;
            } else {
              (is_member_level_buy == 1) && (canLevelBuy = true);
            }

            if (that.data.pageNum==1) that.setData({ copy_text_arr: rdata.copy_text_arr || [] })
            that.hasRefeshin = false;
            console.log(rushList);console.log('==========')
            that.setData({
              rushList: rushList,
              pageNum: that.data.pageNum + 1,
              loadMore: false,
              reduction,
              tip: '',
              is_open_vipcard_buy: is_open_vipcard_buy || 0,
              is_vip_card_member,
              is_member_level_buy,
              canLevelBuy
            }, ()=>{
              if (that.isFirst == 1) {
                that.isFirst++;
                if (rushList.length && !that.$data.stickyTop) {
                  wx.createSelectorQuery().select(".tab-nav-query").boundingClientRect(function (t) {
                    if (t && t.top){
                      wcache.put('tabPos', t);
                      that.$data.stickyTop = t.top + t.height, that.$data.stickyBackTop = t.top;
                    } else {
                      let tabpos = wcache.get('tabPos', false);
                      if (tabpos) that.$data.stickyTop = tabpos.top + tabpos.height, that.$data.stickyBackTop = tabpos.top;
                    }
                  }).exec();
                  that.$data.scrollTop > that.$data.stickyTop && wx.pageScrollTo({
                    duration: 0,
                    scrollTop: that.$data.stickyTop + 4
                  });
                }
                that.getScrollHeight();
              }
              
              if (that.data.pageNum == 2 && res.data.list.length < 10) {
                console.log('load_over_goods_list_begin')
                that.$data.loadOver = true;
                that.hasRefeshin = true;
                that.setData({
                  loadMore: true
                }, () => {
                  that.load_over_gps_goodslist();
                });
              }
            });
          } else if (res.data.code == 1) {
            that.$data.loadOver = true;
            that.load_over_gps_goodslist();
          } else if (res.data.code == 2) {
            //no login
            that.setData({ needAuth: true, couponRefresh: false, hasAlartShopModal: false })
          }
        },
        complete: function() {
          that.$data.isLoadData = false;
          // wx.hideLoading();
          setTimeout(function(){ wx.hideLoading(); },1000);
        }
      })
    } else {
      that.load_over_gps_goodslist();
    }
  },

  /**
   * 组合倒计时时间
   */
  transTime: function(list) {
    let that = this;
    let e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0;
    e === 0 && list.map(function(t) {
      t.end_time *= 1000;
      that.$data.countDownMap[t.end_time] = t.end_time, that.$data.actEndMap[t.end_time] = t.end_time <= new Date().getTime() || t.spuCanBuyNum == 0;
    })
    return that.data.rushList.concat(list);
  },

  /**
   * 获取售罄商品
   */
  load_over_gps_goodslist: function() {
    var token = wx.getStorageSync('token');
    var that = this;
    var cur_community = wx.getStorageSync('community');
    var gid = that.data.classificationId;

    if (!that.$data.hasOverGoods && that.$data.loadOver) {
      that.$data.hasOverGoods = true;
      that.setData({
        loadMore: true
      });
      app.util.request({
        'url': 'entry/wxapp/index',
        'data': {
          controller: 'index.load_over_gps_goodslist',
          token: token,
          pageNum: that.$data.overPageNum,
          head_id: cur_community.communityId,
          gid,
          is_index_show: 1
        },
        dataType: 'json',
        success: function(res) {
          if (res.data.code == 0) {
            let rushList = that.transTime(res.data.list);
            for (let s in that.$data.countDownMap) that.initCountDown(that.$data.countDownMap[s]);

            that.$data.hasOverGoods = false;
            that.$data.overPageNum += 1;
            that.setData({
              rushList: rushList,
              loadMore: false,
              tip: ''
            }, ()=>{
              if (that.isFirst == 1) {
                that.isFirst++;
                if (rushList.length && !that.$data.stickyTop) {
                  wx.createSelectorQuery().select(".tab-nav-query").boundingClientRect(function (t) {
                    if (t && t.top) {
                      wcache.put('tabPos', t);
                      that.$data.stickyTop = t.top + t.height, that.$data.stickyBackTop = t.top;
                    } else {
                      let tabpos = wcache.get('tabPos', false);
                      if (tabpos) that.$data.stickyTop = tabpos.top + tabpos.height, that.$data.stickyBackTop = tabpos.top;
                    }
                  }).exec();
                  that.$data.scrollTop > that.$data.stickyTop && wx.pageScrollTo({
                    duration: 0,
                    scrollTop: that.$data.stickyTop + 4
                  });
                }
                that.getScrollHeight();
              }
            });
          } else if (res.data.code == 1) {
            if (that.$data.overPageNum == 1 && that.data.rushList.length == 0) that.setData({
              showEmpty: true
            })
            that.setData({
              loadMore: false,
              tip: '^_^已经到底了'
            })
          } else if (res.data.code == 2) {
            that.setData({ needAuth: true, couponRefresh: false , hasAlartShopModal: false})
          }
          that.$data.isLoadData = false;
        }
      })
    } else {
      that.$data.isLoadData = false;
    }
  },

  /**
   * 监控分类导航
   */
  classificationChange: function(t) {
    console.log(t.detail.e)
    wx.showLoading();
    var that = this;
    this.$data = {...this.$data, ...{
      overPageNum: 1,
      loadOver: false,
      hasOverGoods: false,
      countDownMap: {},
      actEndMap: {},
      timer: {}
    }
    }, this.hasRefeshin = false, this.setData({
      rushList: [],
      showEmpty: false,
      pageNum: 1,
      "classification.activeIndex": t.detail.e,
      classificationId: t.detail.a
    }, function() {
      if (this.$data.stickyFlag && (that.$data.scrollTop != that.$data.stickyTop+5)){
        console.log('滚动了')
        let windowWidth = app.globalData.systemInfo && app.globalData.systemInfo.windowWidth || 375;
        let taBH = windowWidth/750*72;
        wx.pageScrollTo({ scrollTop: that.$data.stickyTop - taBH, duration: 0 })
      }
      that.load_goods_data();
    });
  },

  /**
  * 监控即将抢购分类导航
  */
  commingClassificationChange: function (t) {
    wx.showLoading();
    var that = this;
    that.tpage = 1;
    this.$data = {...this.$data, ...{hasCommingGoods: true} },
    this.setData({
      showCommingEmpty: false,
      commingList: [],
      "commingClassification.activeIndex": t.detail.e,
      commingClassificationId: t.detail.a
    }, function () {
      if (this.$data.stickyFlag && (that.$data.scrollTop != that.$data.stickyTop + 5)) {
        wx.pageScrollTo({ scrollTop: that.$data.stickyTop + 5, duration: 0 })
      }
      that.getCommingList();
    });
  },

  // 抢购切换
  tabSwitch: function (t) {
    var that = this;
    var tabIdx = 1 * t.currentTarget.dataset.idx;
    this.setData({ tabIdx: tabIdx }, ()=>{
      if (tabIdx == 1) {
        if (that.$data.stickyFlag && (that.$data.scrollTop != that.$data.stickyTop + 5)) {
          wx.pageScrollTo({ scrollTop: that.$data.stickyTop + 5, duration: 0 })
        }
        if (that.tpage == 1) {
          that.getCommingList();
        }
      }
    })
  },

  /**
   * 即将开抢列表
   */
  getCommingList: function(){
    this.data.commigLoadMore && wx.showLoading();
    var token = wx.getStorageSync('token');
    var that = this;
    var cur_community = wx.getStorageSync('community');
    var gid = this.data.commingClassificationId || 0;
    that.$data.isLoadData = true;

    if (that.$data.hasCommingGoods) {
      that.$data.hasCommingGoods = false;
      that.setData({ commigLoadMore: true });
      app.util.request({
        url: 'entry/wxapp/index',
        data: {
          controller: 'index.load_comming_goodslist',
          token: token,
          pageNum: that.tpage,
          head_id: cur_community.communityId,
          gid
        },
        dataType: 'json',
        success: function (res) {
          wx.hideLoading();
          if (res.data.code == 0) {
            let commingList = res.data.list;
            commingList = that.data.commingList.concat(commingList);
            that.$data.hasCommingGoods = true;
            that.tpage += 1;
            that.setData({
              commingList: commingList,
              commigLoadMore: false,
              commigTip: ''
            },()=>{
              that.getScrollHeight();
            });
          } else if (res.data.code == 1) {
            if (that.tpage == 1 && that.data.commingList.length == 0) that.setData({
              showCommingEmpty: true
            })
            that.setData({
              commigLoadMore: false,
              commigTip: '^_^已经到底了'
            })
          } else if (res.data.code == 2) {
            that.setData({ needAuth: true, couponRefresh, hasAlartShopModal: false })
          }
          that.$data.isLoadData = false;
        }
      })
    } else{
      that.$data.isLoadData = false;
      !that.data.commigLoadMore && wx.hideLoading();
    }
  },

  openSku: function(t) {
    if (!this.authModal()) return;
    var that = this,
      e = t.detail;
    var goods_id = e.actId;
    var options = e.skuList;
    that.setData({
      addCar_goodsid: goods_id
    })

    let list = options.list || [];
    let arr = [];
    if (list && list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        let sku = list[i]['option_value'][0];
        let temp = {
          name: sku&&sku['name'],
          id: sku&&sku['option_value_id'],
          index: i,
          idx: 0
        };
        arr.push(temp);
      }
      // arr.sort((a,b)=>{ return a.id - b.id });

      var id = '';
      for (let i = 0; i < arr.length; i++) {
        if (i == arr.length - 1) {
          id = id + arr[i]['id'];
        } else {
          id = id + arr[i]['id'] + "_";
        }
      }

      console.log(id)

      var cur_sku_arr = options.sku_mu_list[id] || {};

      that.setData({
        sku: arr,
        sku_val: 1,
        cur_sku_arr: cur_sku_arr,
        skuList: e.skuList,
        visible: true,
        showSku: true,
        is_take_vipcard: e.is_take_vipcard || '',
        is_mb_level_buy: e.is_mb_level_buy || ''
      });
    } else {
      let goodsInfo = e.allData;
      that.setData({
        sku: [],
        sku_val: 1,
        skuList: [],
        cur_sku_arr: goodsInfo
      })
      let formIds = {
        detail: {
          formId: ""
        }
      };
      formIds.detail.formId = "the formId is a mock one";
      that.gocarfrom(formIds);
    }

  },

  focus: function() {
    this.data.focusFlag = true;
  },

  canBuyFn: function(a, e) {
    var u = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {},
      i = this.data.skuList[e].canBuyNum - a,
      s = {
        value: a
      };
    i <= 10 && (s.canBuyMsg = "还可以购买 " + i + " 件"), this.data.canBuyMsg && i > 10 && (s.canBuyMsg = ""),
      this.setData(t({}, s, u));
  },

  changeNumber: function(t) {
    var a = t.detail;
    this.data.focusFlag = false, a && this.canBuyFn(a.value, this.data.current);
  },

  goOrder: function() {
    var that = this;
    if (that.data.can_car) {
      that.data.can_car = false;
    }
    var token = wx.getStorageSync('token');
    var community = wx.getStorageSync('community');

    var goods_id = that.data.addCar_goodsid;
    var community_id = community.communityId;
    var quantity = that.data.sku_val;

    var cur_sku_arr = that.data.cur_sku_arr;

    var sku_str = '';
    var is_just_addcar = 1;

    if (cur_sku_arr && cur_sku_arr.option_item_ids) {
      sku_str = cur_sku_arr.option_item_ids;
    }

    let data = {
      goods_id,
      community_id,
      quantity,
      sku_str,
      buy_type: 'dan',
      pin_id: 0,
      is_just_addcar
    }
    util.addCart(data).then(res=>{
      if(res.showVipModal==1) {
        let { pop_vipmember_buyimage } = res.data;
        wx.hideLoading();
        that.setData({ pop_vipmember_buyimage, showVipModal: true, visible: false })
      } else {
        if (res.data.code == 3 || res.data.code == 7) {
          wx.showToast({
            title: res.data.msg,
            icon: 'none',
            duration: 2000
          })
        } else if (res.data.code == 4) {
          wx.hideLoading();
          that.setData({ needAuth: true, showAuthModal: true, visible: false })
        } else if (res.data.code == 6) {
          let max_quantity = res.data.max_quantity || '';
          (max_quantity > 0) && that.setData({ sku_val: max_quantity })
          var msg = res.data.msg;
          wx.showToast({
            title: msg,
            icon: 'none',
            duration: 2000
          })
        } else {
          if (is_just_addcar == 1) {
            that.closeSku();
            (0, status.cartNum)(res.data.total);
            that.setData({ cartNum: res.data.total })
            wx.showToast({
              title: "已加入购物车",
              image: "../../images/addShopCart.png"
            })
          } else {
            var pages_all = getCurrentPages();
            if (pages_all.length > 3) {
              wx.redirectTo({
                url: '/community/pages/buy/index?type=' + that.data.order.buy_type
              })
            } else {
              wx.navigateTo({
                url: '/community/pages/buy/index?type=' + that.data.order.buy_type
              })
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

  /**
   * 确认加入购物车
   */
  gocarfrom: function(e) {
    var that = this;
    var is_just_addcar = 1;
    wx.showLoading();
    this.setData({
      is_take_vipcard: '',
      is_mb_level_buy: ''
    })
    a.collectFormIds(e.detail.formId);
    that.goOrder();
  },

  /**
   * 关闭购物车选项卡
   */
  closeSku: function() {
    this.setData({
      visible: 0,
      stopClick: false,
    });
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
      wx.showToast({
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
      let cur_sku_arr = options.sku_mu_list[id];
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
  
  skuConfirm: function() {
    this.closeSku(), (0, status.cartNum)().then((res) => {
      res.code == 0 && that.setData({ cartNum: res.data })
    });
  },

  /**
   * 返回顶部
   */
  backTop: function() {
    this.stickyFlag = false, wx.pageScrollTo({
      scrollTop: 0,
      duration: 500
    });
  },

  goLink: function(event) {
    if (!this.authModal()) return;
    let url = event.currentTarget.dataset.link;
    let needauth = event.currentTarget.dataset.needauth || '';
    console.log(needauth)
    if(needauth){ if (!this.authModal()) return; }
    url && wx.navigateTo({ url })
  },

  /**
   * 导航小图标
   */
  getNavigat: function(){
    let that = this;
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'index.get_navigat'
      },
      dataType: 'json',
      success: function (res) {
        if (res.data.code == 0) {
          let navigat = res.data.data || [];
          let navigatEmpty = [];
          if (navigat.length>0) {
            let len = (5-navigat.length%5) || 0;
            if(len<5&&len>0) navigatEmpty = new Array(len);
          }
          that.setData({ navigat, navigatEmpty })
        }
      }
    })
  },
  
  /**
   * 导航图标跳转
   */
  goNavUrl: function(t) {
    let idx = t.currentTarget.dataset.idx;
    let { navigat, needAuth } = this.data;
    if (navigat.length > 0) {
      let url = navigat[idx].link;
      let type = navigat[idx].type;
      if(util.checkRedirectTo(url, needAuth)){
        this.authModal();
        return;
      }
      if (type== 0){
        // 跳转webview
        wx.navigateTo({
          url: '/community/pages/web-view?url=' + encodeURIComponent(url),
        })
      } else if (type==1) {
        if (url.indexOf('community/pages/index/index') != -1 || url.indexOf('community/pages/order/shopCart') != -1 || url.indexOf('community/pages/user/me') != -1 || url.indexOf('community/pages/type/index') != -1) {
          wx.switchTab({ url: url })
        } else {
          wx.navigateTo({ url: url })
        }
        
      } else if (type==2){
        // 跳转小程序
        let appid = navigat[idx].appid;
        appid && wx.navigateToMiniProgram({
          appId: navigat[idx].appid,
          path: url,
          extraData: {},
          envVersion: 'release',
          success(res) {
            // 打开成功
          },
          fail(error) {
            console.log(error)
          }
        })
      } else if (type == 3){
        //首页分类
        // t.detail.e 选中索引
        // t.detail.a 选中id
        let classification = this.data.classification;
        let tabs = classification && classification.tabs;
        let cid = url;
        let activeIdx = tabs.findIndex((p) => { return p.id == cid });
        if (activeIdx!=-1) {
          let cateInfo = {
            detail: { e: activeIdx, a: cid }
          };
          this.classificationChange(cateInfo);
        } else {
          wx.showToast({
            title: '分类不存在或已关闭',
            icon: 'none'
          })
        }
      } else if (type == 4) {
        //独立分类
        app.globalData.typeCateId = url;
        wx.switchTab({
          url: '/community/pages/type/index'
        })
      }
    }
  },

  /**
   * 幻灯片跳转
   */
  goBannerUrl: function (t) {
    let idx = t.currentTarget.dataset.idx;
    let { slider_list, needAuth } = this.data;
   
    if (slider_list.length > 0) {
      let url = slider_list[idx].link;
      let type = slider_list[idx].linktype;
      if (util.checkRedirectTo(url, needAuth)) {
        this.authModal();
        return;
      }
      console.log(url);
      if (type == 0) {
        // 跳转webview
        url && wx.navigateTo({ url: '/community/pages/web-view?url=' + encodeURIComponent(url) })
      } else if (type == 1) {
        if (url.indexOf('community/pages/index/index') != -1 || url.indexOf('community/pages/order/shopCart') != -1 || url.indexOf('community/pages/user/me') != -1 || url.indexOf('community/pages/type/index') != -1) {
          url && wx.switchTab({ url: url })
        } else {
          url && wx.navigateTo({ url: url })
        }

      } else if (type == 2) {
        // 跳转小程序
        let appid = slider_list[idx].appid;
        appid && wx.navigateToMiniProgram({
          appId: slider_list[idx].appid,
          path: url,
          extraData: {},
          envVersion: 'release',
          success(res) {
            // 打开成功
          },
          fail(error) {
            console.log(error)
          }
        })
      }
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({ couponRefresh: false, newComerRefresh: false, stopNotify: true , hasAlartShopModal: false});
    this.tpage = 1;
    this.$data = {
      ...this.$data, ...{
        overPageNum: 1,
        loadOver: false,
        hasOverGoods: false,
        countDownMap: {},
        actEndMap: {},
        timer: {},
        stickyFlag: false,
        hasCommingGoods: true
      }
    }
    this.hasRefeshin = false;
    this.setData({
      rushList: [],
      commingList: [],
      tabIdx: 0,
      pageNum: 1,
      couponRefresh: true,
      hasAlartShopModal: true,
      newComerRefresh: true,
      stopNotify: false,
      rushEndTime: 0
    }, ()=>{
      this.loadPage();
    })
    wx.stopPullDownRefresh();
  },

  onReachBottom: function(e) {
    if(this.data.ishide_index_goodslist==1) return;
    if (this.data.tabIdx==0){
      this.load_goods_data();
    } else {
      this.getCommingList();
    }
  },

  /**
   * 获取团长位置
   */
  getCommunityPos: function (community_id){
    let that = this;
    app.util.request({
      'url': 'entry/wxapp/user',
      'data': {
        controller: 'index.get_community_position',
        communityId: community_id
      },
      dataType: 'json',
      method: 'POST',
      success: function (res) {
        if (res.data.code == 0) {
          that.postion = res.data.postion;
        }
      }
    })
  },

  /**
  * 查看地图
  */
  gotoMap: function () {
    let community = this.data.community;
    let postion = this.postion || {lat: 0, lon: 0};
    let longitude = parseFloat(postion.lon),
      latitude = parseFloat(postion.lat),
      name = community.disUserName,
      address = `${community.fullAddress}(${community.communityName})`;
    wx.openLocation({
      latitude: latitude,
      longitude: longitude,
      name: name,
      address: address,
      scale: 28
    })
  },

  share_handler: function () {
    this.setData({
      is_share_html: false
    })
  },

  hide_share_handler: function () {
    this.setData({
      is_share_html: true
    })
  },

  // 搜索
  goResult: function (e) {
    let keyword = e.detail.value.keyword.replace(/\s+/g, '');
    if (!keyword) {
      wx.showToast({
        title: '请输入关键词',
        icon: 'none'
      })
      return;
    }
    wx.navigateTo({
      url: '/community/pages/type/result?keyword=' + keyword,
    })
  },

  /**
   * 新人优惠券显示开关
   */
  toggleCoupon: function(e){
    let auth = e.currentTarget.dataset.auth || '';
    let needAuth = this.data.needAuth || '';
    if(needAuth && auth) {
      this.setData({
        showAuthModal: true,
        showCouponModal: false
      })
    } else {
      this.setData({
        showCouponModal: !this.data.showCouponModal,
        hasAlertCoupon: false
      })
    }
  },

  changeCartNum: function(t) {
    let that = this;
    let e = t.detail;
    (0, status.cartNum)(that.setData({ cartNum: e }));
  },

  /**
   * 一键复制文本
   */
  copyText: function (e) {
    let copy_text_arr = this.data.copy_text_arr;
    let community = this.data.community;
    let communityName = community.communityName;
    let disUserName = community.disUserName;
    let communityAddress = community.address || community.communityAddress || community.fullAddress;
    let data = '-团长信息-\r\n小区：' + communityName + '\r\n团长：' + disUserName + '\r\n自提点：' + communityAddress + '\r\n\r\n今日推荐\r\n';
    if (copy_text_arr.length) {
      copy_text_arr.forEach(function(item, index){
        data += (index + 1) + '.【' + item.goods_name + '】  团购价' + item.price + '\r\n';
        data += '~~~~~~~~~~~~~~~~~~~~\r\n';
      })
    }
    let that = this;
    wx.setClipboardData({
      data: data,
      success: function (res) {
        wx.getClipboardData({
          success: function (res) {
            that.setData({ showCopyText: false })
            wx.showToast({
              title: '复制成功'
            })
          }
        })
      }
    })
  },

  /**
   * 显示关闭复制文本
   */
  showCopyTextHandle: function(e){
    if (!this.authModal()) return;
    let showCopyText = e.currentTarget.dataset.status;
    this.setData({ showCopyText })
  },

  /**
   * 优惠券获取
   */
  getCoupon: function () {
    let that = this;
    let token = wx.getStorageSync('token');
    app.util.request({
      url: 'entry/wxapp/index',
      data: { controller: 'goods.get_seller_quan', token },
      dataType: 'json',
      success: function (res) {
        let list = res.data.quan_list;
        let hasCoupon = false;
        let hasAlertCoupon = false;
        if (Object.prototype.toString.call(list) == '[object Object]' && Object.keys(list).length > 0) hasCoupon = true;
        if (Object.prototype.toString.call(list) == '[object Array]' && list.length > 0) hasCoupon = true;

        let alert_quan_list = res.data.alert_quan_list || [];
        if (Object.prototype.toString.call(alert_quan_list) == '[object Object]' && Object.keys(alert_quan_list).length > 0) hasAlertCoupon = true;
        if (Object.prototype.toString.call(alert_quan_list) == '[object Array]' && alert_quan_list.length > 0) hasAlertCoupon = true;

        let totalAlertMoney = 0;
        if (Object.prototype.toString.call(alert_quan_list) == '[object Object]' && Object.keys(alert_quan_list).length > 0) {
          Object.keys(alert_quan_list).forEach(function(item){
            totalAlertMoney += alert_quan_list[item].credit*1;
          })
        } else if (Object.prototype.toString.call(alert_quan_list) == '[object Array]' && alert_quan_list.length > 0) {
          alert_quan_list.forEach(function (item) {
            totalAlertMoney += item.credit * 1;
          })
        }

        that.setData({
          quan: res.data.quan_list || [],
          alert_quan_list,
          hasCoupon,
          hasAlertCoupon,
          showCouponModal: hasAlertCoupon,
          totalAlertMoney: totalAlertMoney.toFixed(2)
        })
      }
    });
  },

  receiveCoupon: function (event) {
    if (!this.authModal()) return;
    let quan_id = event.currentTarget.dataset.quan_id;
    let type = event.currentTarget.dataset.type || 0;
    var token = wx.getStorageSync('token');
    var quan_list = [];
    if(type==1) {
      quan_list = this.data.alert_quan_list;
    } else {
      quan_list = this.data.quan;
    }
    var that = this;

    app.util.request({
      url: 'entry/wxapp/index',
      data: { controller: 'goods.getQuan', token, quan_id },
      dataType: 'json',
      success: function (msg) {
        //1 被抢光了 2 已领过  3  领取成功
        if (msg.data.code == 0) {
          wx.showToast({
            title: msg.data.msg || '被抢光了',
            icon: 'none'
          })
        } else if (msg.data.code == 1) {
          wx.showToast({
            title: '被抢光了',
            icon: 'none'
          })
        } else if (msg.data.code == 2) {
          wx.showToast({
            title: '已领取',
            icon: 'none'
          })
          var new_quan = [];
          for (var i in quan_list) {
            if (quan_list[i].id == quan_id) quan_list[i].is_get = 1;
            new_quan.push(quan_list[i]);
          }
          that.setData({ quan: new_quan })
        }
        else if (msg.data.code == 4) {
          wx.showToast({
            title: '新人专享',
            icon: 'none'
          })
        } 
        else if (msg.data.code == 3) {
          var new_quan = [];
          for (var i in quan_list) {
            if (quan_list[i].id == quan_id) quan_list[i].is_get = 1;
            new_quan.push(quan_list[i]);
          }
          if(type==1) {
            that.setData({ alert_quan_list: new_quan })
          } else {
            that.setData({ quan: new_quan })
          }
          wx.showToast({
            title: '领取成功',
          })
        } else if (msg.data.code == 4) {
          // 未登录
        }
      }
    })
  },

  goUse: function (e) {
    this.setData({ showCouponModal: false, hasAlertCoupon: false })
    let idx = e.currentTarget.dataset.idx;
    let quan = this.data.alert_quan_list || [];
    console.log(Object.keys(quan).length)
    if (Object.keys(quan).length >= idx) {
      if (quan[idx].is_limit_goods_buy == 0) {
        wx.switchTab({
          url: '/community/pages/index/index',
        })
      } else if (quan[idx].is_limit_goods_buy == 1) {
        let id = quan[idx].limit_goods_list;
        let ids = id.split(',');
        let url = '';
        if (ids.length > 1) {
          url = '/community/pages/type/result?type=2&good_ids=' + id;
        } else {
          url = '/community/pages/goods/goodsDetail?id=' + id;
        }
        wx.navigateTo({ url: url })
      } else if (quan[idx].is_limit_goods_buy == 2) {
        let gid = quan[idx].goodscates || 0;
        wx.navigateTo({
          url: '/community/pages/type/result?type=1&gid=' + gid,
        })
      }
    }
  },

  /**
   * 分类专题
   */
  get_type_topic: function () {
    let that = this;
    var cur_community = wx.getStorageSync('community');
    app.util.request({
      url: 'entry/wxapp/index',
      data: { 
        controller: 'goods.get_category_col_list',
        head_id: cur_community.communityId
      },
      dataType: 'json',
      success: function (res) {
        if(res.data.code == 0) {
          let typeTopicList = res.data.data || [];
          that.setData({ typeTopicList })
        }
      }
    })
  },

  /**
   * 拼团列表
   */
  getPinList: function () {
    let that = this;
    var community = wx.getStorageSync('community');
    let head_id = community.communityId || '';
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'group.get_pintuan_list',
        is_index: 1,
        head_id
      },
      dataType: 'json',
      success: function (res) {
        if (res.data.code == 0) {
          let pinList = {};
          let { list, pintuan_index_coming_img, pintuan_index_show, pintuan_index_show_listtop } = res.data;
          pinList.list = list || [];
          pinList.img = pintuan_index_coming_img || '';
          pinList.show = pintuan_index_show || 0;
          pinList.showRow = pintuan_index_show_listtop || 0;
          that.setData({ pinList })
        }
      }
    })
  },

  /**
   * 魔方图标跳转
   */
  goCube: function (t) {
    let idx = t.currentTarget.dataset.idx; // 当前链接索引
    let index = t.currentTarget.dataset.index; // 当前魔方索引
    let { cube, needAuth } = this.data;
    console.log(cube)
    if (cube.length > 0) {
      let url = cube[index].thumb.link[idx];
      let type = (cube[index].thumb.linktype && cube[index].thumb.linktype[idx]);
      (type === (void 0)) && (type = 1);
      if (util.checkRedirectTo(url, needAuth)) {
        this.authModal();
        return;
      }
      if (type == 0) {
        // 跳转webview
        url = cube[index].thumb.webview[idx];
        wx.navigateTo({
          url: '/community/pages/web-view?url=' + encodeURIComponent(url),
        })
      } else if (type == 1) {
        if (url.indexOf('community/pages/index/index') != -1 || url.indexOf('community/pages/order/shopCart') != -1 || url.indexOf('community/pages/user/me') != -1 || url.indexOf('community/pages/type/index') != -1) {
          url && wx.switchTab({ url: url })
        } else {
          url && wx.navigateTo({ url: url })
        }
      } else if (type == 2) {
        //
        // 跳转小程序
                let appid = cube[index].thumb.appid[idx];
                appid && wx.navigateToMiniProgram({
                  appId: appid,
                  path: url,
                  extraData: {},
                  envVersion: 'release',
                  success(res) {
                    // 打开成功
                  },
                  fail(error) {
                    console.log(error)
                  }
                })
        //
        /*
        // 跳转小程序
        let appid = navigat[idx].appid;
        appid && wx.navigateToMiniProgram({
          appId: navigat[idx].appid,
          path: url,
          extraData: {},
          envVersion: 'release',
          success(res) {
            // 打开成功
          },
          fail(error) {
            console.log(error)
          }
        })
        */
      } else if (type == 3) {
        let classification = this.data.classification;
        let tabs = classification && classification.tabs;
        let cid = url;
        let activeIdx = tabs.findIndex((p) => { return p.id == cid });
        if (activeIdx != -1) {
          let cateInfo = {
            detail: { e: activeIdx, a: cid }
          };
          this.classificationChange(cateInfo);
        }
      } else if (type == 4) {
        //独立分类
        app.globalData.typeCateId = url;
        wx.switchTab({
          url: '/community/pages/type/index'
        })
      }
    }
  },

  getSecKillGoods: function (seckill_time){
    var that = this;
    var cur_community = wx.getStorageSync('community');
    var token = wx.getStorageSync('token');
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'index.load_gps_goodslist',
        token: token,
        pageNum: 1,
        head_id: cur_community.communityId,
        seckill_time,
        is_seckill: 1,
        per_page: 10000
      },
      dataType: 'json',
      success: function (res) {
        if(res.data.code==0) {
          let secRushList = res.data.list || [];
          that.setData({ secRushList })
        }
      }
    })
  },

  scrollSecKillGoodsChange: function (t) {
    this.setData({
      secKillGoodsIndex: t.detail.current + 1
    });
  },

  /**
   * 显示秒杀时间切换
   */
  changeSecKillTime(t){
    let that = this;
    let seckill_time = t.currentTarget.dataset.time;
    let secKillActiveIdx = t.currentTarget.dataset.idx;
    this.setData({
      secRushList: [],
      secKillActiveIdx
    }, ()=>{
      that.getSecKillGoods(seckill_time);
    })
  },

  // 输入框获得焦点
  handleFocus: function () {
    this.focusFlag = true;
  },

  handleBlur: function (t) {
    let a = t.detail;
    let val = parseInt(a.value);
    if (val == '' || isNaN(val)){
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

  /** 
   * 图片信息
   */
  imageLoad: function (e) {
    var imageSize = util.imageUtil(e)
    this.setData({
      imageSize
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

  videEnd: function () {
    this.setData({
      fmShow: true
    })
  },

  bindload: function(t){
    console.log(t.detail)
  },

  binderror: function(t){
    this.setData({ hideMpAccount: true })
    console.log(t.detail)
  },

  closeMpaccount: function(){
    this.setData({ show_index_wechat_oa: 0 })
  },
  //  //获取直播相关信息
  getZhiboInfo: function (zb){
    let that = this;
    app.util.request({
      //
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'index.get_zhibo_info'
      },
      //
      dataType: 'json',
      success: function (res) {
          let rzbdata = res.data;
          console.log(rzbdata);
          that.setData({
            zb_roomid:rzbdata.roomid,
            zb_status:rzbdata.showzbimg
          })
      }
    })
  },
  //
  userlogin:function()
  {

  },
  //
  showvedio:function()
  {
    wx.navigateTo({
      url: '/community/pages/suyuan/content'
  })
  },
  //
    goZhibo:function()
    {
      let zoomid = this.data.zb_roomid;
      let customParams = encodeURIComponent(JSON.stringify({ path: 'pages/index/index', pid: 1 }));
      // 开发者在直播间页面路径上携带自定义参数（如示例中的path和pid参数），
      //后续可以在分享卡片链接和跳转至商详页时获取，详见【获取自定义参数】、【直播间到商详页面携带参数】章节（上限600个字符，超过部分会被截断）
      wx.navigateTo({
          url: 'plugin-private://wx2b03c6e691cd7370/pages/live-player-plugin?room_id='+ zoomid,
      })
    },
  onShareAppMessage: function(res) {
    this.setData({ is_share_html: true });
    var community = wx.getStorageSync('community');
    var community_id = community.communityId;
    var member_id = wx.getStorageSync('member_id');
    console.log('首页分享地址：');
    console.log(community_id, member_id);
    return {
      title: this.data.shop_info.title,
      path: "community/pages/index/index?community_id=" + community_id + '&share_id=' + member_id,
      imageUrl: this.data.shop_info.shop_index_share_image,
      success: function() {},
      fail: function() {}
    };
  },
  //分享朋友圈
  onShareTimeline: function(res) {
    this.setData({ is_share_html: true });
    var community = wx.getStorageSync('community');
    var community_id = community.communityId;
    var member_id = wx.getStorageSync('member_id');
    return {
      title: this.data.shop_info.title,
      path: "community/pages/index/index?community_id=" + community_id + '&share_id=' + member_id,
      imageUrl: this.data.shop_info.shop_index_share_image,
      success: function() {},
      fail: function() {}
    };
  },

  goToShop: function(e){
    let entryLinkUrl =  e.currentTarget.dataset.link;
    /**
     * 进入商品列表：/community/pages/type/result?type=2&good_ids=22
     * 进入某个商品：/community/pages/goods/goodsDetail?id=22
     * 进入拼团商品：/community/moduleA/pin/goodsDetail?id=193
     * 进入套餐商品：/community/pages/packages/detail?id=8
     * 进入海报：    /community/pages/poster/index?id=4
     */

    wx.navigateTo({ url: entryLinkUrl});
    this.setData({
      showShopModal: false,
      hasAlartShopModal:false
    })
  },

  goToClose: function(e){
      this.setData({
        showShopModal: false,
        hasAlartShopModal:false
      })
   },

  getShopModel: function(){
    let that = this;
    let token = wx.getStorageSync('token');
    app.util.request({
      url: 'entry/wxapp/index',
      data: { controller: 'advertisement.get_info', token },
      dataType: 'json',
      success: function (res) {
        let list = res.data.data;
        let code = res.data.code;
        if(code == 0){
          that.setData({
            showShopModal: true,
            showShopTitle: list.advmname,
            showShopImg:   list.thumbimg,
            showShopLinkUrl:list.link
          })
        }else{
          that.setData({
            showShopModal: false
          })
        }
      }
    });
  },

  signIn: function () {
    if (!this.authModal() || this.isLock) return;
    this.isLock = true;
    var token = wx.getStorageSync('token');
    let that = this;
    app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'signinreward.sub_signin',
        token: token
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          that.setData({showSignModal : false});
          app.util.message('签到成功', '', 'success');
        } else{
          if(res.data.code == 1){
            that.setData({showSignModal : false});
          }
          app.util.message(res.data.msg || '签到失败', '', 'success');
        }
        this.isLock = false;
      }
    })
  },

  rechargeIn: function(){
    if (!this.authModal()) return;
    wx.navigateTo({
      url: '/community/pages/user/charge',
    })
  },

  toShowGoodType: function(e){
     var id =  e.currentTarget.dataset.id
     if(id != '' && id != undefined){
      wx.redirectTo({
        url: "/community/pages/type/details?id="+id
      });
     }
  }
})