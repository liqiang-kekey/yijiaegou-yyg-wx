var app = getApp();
var a = require("../../utils/public");
var status = require('../../utils/index.js');
var util = require('../../utils/util.js');
var wcache = require('../../utils/wcache.js');

Page({
  mixins: [require('../../mixin/globalMixin.js')],
  data: {
    cartNum: 0,
    rushCategoryData: {
      tabs: [],
      activeIndex: 0
    },
    rushList: [],
    categoryScrollBarTop: 0,
    resetScrollBarTop: 50,
    loadMore: true,
    loadText: "加载中...",
    scrollViewHeight: 0,
    isFirstCategory: true,
    isLastCategory: false,
    pageEmpty: false,
    active_sub_index: 0,
    needPosition: true,
    groupInfo: {
      group_name: '社区',
      owner_name: '团长'
    }
  },
  $data: {
    options: {},
    rushCategoryId: "",
    pageNum: 1,
    actIds: [],
    loading: true,
    isScrollTop: true,
    isScrollBottom: false,
    scrollInfo: null,
    isSetCategoryScrollBarTop: true,
    touchStartPos: {
      pageX: 0,
      pageY: 0
    },
    rushList: []
  },
  isFirst: 0,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.showLoading();
    wx.hideTabBar();
    status.setNavBgColor();
    status.setGroupInfo().then((groupInfo) => { that.setData({ groupInfo }) });
    let isIpx = app.globalData.isIpx;
    let that = this;
    this.getScrollViewHeight();
    this.setData({
      subCateHeight: this.getPx(44),
      isIpx: isIpx ? true : false
    })

    console.log('options', options);
    if (options && Object.keys(options).length != 0) {
      let localCommunity = wx.getStorageSync('community');
      let localCommunityId = localCommunity.communityId || '';
      that.$data.options = options;
      if (options.share_id != 'undefined' && options.share_id > 0) wcache.put('share_id', options.share_id);

      if (options.community_id != 'undefined' && options.community_id > 0) {
        app.util.request({
          url: 'entry/wxapp/index',
          data: {
            controller: 'index.get_community_info',
            community_id: options.community_id
          },
          dataType: 'json',
          success: function(res) {
            var token = wx.getStorageSync('token');
            if (res.data.code == 0) {
              let community = res.data.data;
              let hide_community_change_btn = res.data.hide_community_change_btn;
              if (options.community_id != localCommunityId) {
                if (localCommunityId=='') {
                  wcache.put('community', community);
                  that.setData({ needPosition: false })
                } else {
                  that.setData({
                    showChangeCommunity: true,
                    changeCommunity: community,
                    community: localCommunity,
                    hide_community_change_btn
                  })
                }
              }
            }
            token && that.addhistory();
          }
        })
      }
    }

    this.$data.rushCategoryId = app.globalData.typeCateId || 0;
    app.globalData.typeCateId = 0;
  },

  /**
   * 生命周期函数--监听页面显示
   * JSON.stringify(obj)
   */
  onShow: function() {
    let that = this;
    this.setData({ tabbarRefresh: true })
    this.get_cate_list().then(()=>{
      if (that.isFirst > 1) {
        that.$data.rushCategoryId = app.globalData.typeCateId || 0;
        console.log('typeCateId', that.$data.rushCategoryId);
        app.globalData.typeCateId = 0;
        if (that.$data.rushCategoryId) {
          let rushCategoryData = that.data.rushCategoryData;
          let tabs = rushCategoryData.tabs;
          let active_cate_id = that.$data.rushCategoryId;
          rushCategoryData.activeIndex = tabs.findIndex((p) => {
            return p.id == active_cate_id
          }) || 0;
          that.setData({
            rushCategoryData
          }, () => {
            console.log('setCategory', that.isFirst);
            that.setCategory(rushCategoryData.activeIndex);
          })
        }
      }
    });
    util.check_login_new().then((res) => {
      if (res) {
        (0, status.cartNum)('', true).then((res) => {
          res.code == 0 && that.setData({
            cartNum: res.data
          })
        });
        if (that.isFirst >= 1) {
          let goodsListCarCount = app.globalData.goodsListCarCount; //[{ actId: 84, num: 2}]
          let rushList = that.data.rushList;
          if (goodsListCarCount.length > 0 && rushList.length > 0) {
            let changeCarCount = false;
            goodsListCarCount.forEach(function(item) {
              let k = rushList.findIndex((n) => n.actId == item.actId);
              if (k != -1 && rushList[k].skuList.length === 0) {
                let newNum = item.num * 1;
                rushList[k].car_count = newNum >= 0 ? newNum : 0;
                changeCarCount = true;
              }
            })
            that.setData({
              rushList,
              changeCarCount
            })
          }
        }
      } else {
        that.setData({
          needAuth: true
        })
      }
    })
    that.isFirst++;
  },

  /**
   * 授权成功回调
   */
  authSuccess: function() {
    this.$data = {
      ...this.$data, ...{
        options: {},
        rushCategoryId: "",
        pageNum: 1,
        actIds: [],
        loading: true,
        isScrollTop: true,
        isScrollBottom: false,
        scrollInfo: null,
        isSetCategoryScrollBarTop: true,
        touchStartPos: {
          pageX: 0,
          pageY: 0
        }
      }
    }
    let that = this;
    this.setData({
      needAuth: false,
      showAuthModal: false,
      rushList: [],
      categoryScrollBarTop: 0,
      resetScrollBarTop: 50,
      loadMore: true,
      loadText: "加载中...",
      isFirstCategory: true,
      isLastCategory: false,
      pageEmpty: false,
      active_sub_index: 0,
    },()=>{
      that.get_cate_list().then(()=>{
        that.initPageData();
      });
    })
  },

  authModal: function(t) {
    t.detail && this.setData({ needAuth: true });
    if (this.data.needAuth) {
      this.setData({
        showAuthModal: !this.data.showAuthModal
      });
    }
  },

  vipModal: function(t) {
    this.setData(t.detail)
  },

  /**
   * 确认切换社区
   */
  confrimChangeCommunity: function () {
    let community = this.data.changeCommunity;
    app.globalData.community = community;
    wcache.put('community', community);
    this.setData({
      showChangeCommunity: false,
      needPosition: false
    }, () => {
      this.addhistory();
    })
  },

  /**
   * 关闭切换社区
   */
  closeChangeCommunity: function () {
    this.setData({
      showChangeCommunity: false
    })
  },

  /**
   * 跳转地址选择
   */
  goSelectCommunity: function () {
    wx.redirectTo({
      url: '/community/pages/position/community',
    })
  },

  /**
   * 更新用户社区
   * id: 社区id
   */
  addhistory: function(id = 0) {
    let community_id = 0;
    if (id == 0) {
      var community = wx.getStorageSync('community');
      community_id = community.communityId || '';
    } else {
      community_id = id;
    }
    console.log('history community_id=' + community_id);
    var token = wx.getStorageSync('token');
    let that = this;
    community_id !== void 0 && app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'index.addhistory_community',
        community_id: community_id,
        token: token
      },
      dataType: 'json',
      success: function(res) {
        if (id != 0) that.getHistoryCommunity(), console.log('addhistory+id', id);
      }
    })
  },

  //获取历史社区
  getHistoryCommunity: function() {
    let that = this;
    var token = wx.getStorageSync('token');
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'index.load_history_community',
        token: token
      },
      dataType: 'json',
      success: function(res) {
        if (res.data.code == 0) {
          console.log('getHistoryCommunity');
          let history_communities = res.data.list;
          if (Object.keys(history_communities).length == 0 || history_communities.communityId == 0) isNotHistory = true;

          let resArr = history_communities && history_communities.fullAddress && history_communities.fullAddress.split('省');
          history_communities = Object.assign({}, history_communities, {
            address: resArr[1]
          })
          wcache.put('community', history_communities);
          app.globalData.community = history_communities;
        } else {
          let options = that.options;
          if (options !== void 0 && options.community_id) {
            console.log('新人加入分享进来的社区id:', that.options);
            that.addhistory(options.community_id);
          }
        }
      }
    })
  },

  onPullDownRefresh: function() {
    this.initPageData();
  },

  /**
   * 初始化数据
   */
  initPageData: function() {
    var t = this;
    this.setData({
      isFirstCategory: true,
      isLastCategory: false,
      rushList: [],
      resetScrollBarTop: 50
    }, function() {
      t.getHotList();
    });
  },

  scrollBottom: function() {
    var t = this,
      e = this.$data,
      loading = e.loading;
    if (!loading) {
      e.loading = true;
      this.getHotList();
    }
  },

  touchstart: function(t) {
    if (t.changedTouches && t.changedTouches[0]) {
      var a = t.changedTouches[0],
        e = a.pageX,
        o = a.pageY;
      this.$data.touchStartPos = {
        pageX: e,
        pageY: o
      };
    }
  },

  touchend: function(t) {
    var a = this;
    if (t.changedTouches && t.changedTouches[0]) {
      var e = t.changedTouches[0],
        o = e.pageX,
        i = e.pageY,
        r = this.$data.touchStartPos,
        s = r.pageX,
        n = r.pageY,
        l = this.$data,
        g = l.isScrollTop,
        u = l.isScrollBottom,
        d = l.scrollInfo,
        c = (this.data.rushCategoryData, o - s),
        h = i - n;
      if (Math.abs(h) > Math.abs(c)) {
        if (h > 0) {
          if (!g) return;
          if (this.setData({
              resetScrollBarTop: 50
            }), h > 50) {
            var m = this.data.rushCategoryData.activeIndex - 1;
            if (m < 0) return;
            this.setData({
              resetScrollBarTop: 50
            }, function() {
              a.setCategory(m);
            });
          }
        } else {
          if (!u || !this.data.canNext) return;
          if (h < -50) {
            var y = this.data.rushCategoryData,
              p = y.activeIndex + 1;
            if (p >= y.tabs.length || !this.$data.scrollInfo) return;
            this.setData({
              resetScrollBarTop: d.scrollTop
            }, function() {
              a.setCategory(p);
            });
          }
        }
      } else {
        d && d.scrollTop < 50 && this.setData({
          resetScrollBarTop: 50
        });
      }
    }
  },

  scroll: function(t) {
    var a = t.detail,
      e = a.scrollTop,
      o = a.scrollHeight,
      i = this.data,
      r = i.scrollViewHeight,
      s = i.loadMore;
    this.$data.scrollInfo = a, this.$data.isScrollTop = e <= 49, this.$data.isScrollBottom = !s && o - e - r <= 10;
  },

  /**
   * 搜索栏高度
   */
  getScrollViewHeight: function() {
    var that = this;
    wx.createSelectorQuery().select(".search-bar").boundingClientRect(function(res) {
      res.height && that.setData({
        scrollViewHeight: wx.getSystemInfoSync().windowHeight - res.height
      });
    }).exec();
  },

  changeCategory: function(t) {
    var idx = t.currentTarget.dataset.index;
    console.log(idx)
    idx !== this.data.rushCategoryData.activeIndex && this.setCategory(idx);
  },

  setCategory: function(t) {
    var that = this,
      rushCategoryData = this.data.rushCategoryData,
      tabs = rushCategoryData.tabs[t] || {},
      scrollViewHeight = this.data.scrollViewHeight;

    this.$data.rushCategoryId = tabs.id || null, this.$data.pageNum = 1, this.$data.isSetCategoryScrollBarTop = false;
    let isFirstCategory = !t;
    let isLastCategory = (t == rushCategoryData.tabs.length - 1);
    this.setData({
      "rushCategoryData.activeIndex": t,
      resetScrollBarTop: 50,
      categoryScrollBarTop: 50 * t - (scrollViewHeight - 50) / 2,
      rushList: [],
      canNext: false,
      isFirstCategory,
      isLastCategory,
      active_sub_index: 0,
      showDrop: false
    }, function() {
      that.getHotList();
    });
  },

  getHotList: function() {
    var t = this,
      e = this.$data,
      rushCategoryId = e.rushCategoryId;
    this.$data.loading = true;

    this.reqPromise().then(function() {
      wx.stopPullDownRefresh();
    }).catch(function() {
      var a = {};
      rushCategoryId || (a.pageEmpty = true), t.$data.loading = false, t.setData(a), wx.stopPullDownRefresh();
    });
  },

  reqPromise: function() {
    let that = this;
    return new Promise(function(resolve, reject) {
      let token = wx.getStorageSync('token');
      let cur_community = wx.getStorageSync('community');
      let rushCategoryId = that.$data.rushCategoryId;
      app.util.request({
        url: 'entry/wxapp/index',
        data: {
          controller: 'index.load_gps_goodslist_new',
          token,
          pageNum: that.$data.pageNum,
          head_id: cur_community.communityId,
          gid: rushCategoryId,
          per_page: 30
        },
        dataType: 'json',
        success: function(res) {
          if (res.data.code == 0) {
            let list = res.data.list;
            let h = {};
            if(list.length<30) { h.loadMore = false;h.canNext = true; }
            let rushList = that.data.rushList.concat(list);
            let { full_money, full_reducemoney, is_open_fullreduction, is_open_vipcard_buy, is_vip_card_member, is_member_level_buy } = res.data;
            let reduction = { full_money, full_reducemoney, is_open_fullreduction }

            // 是否可以会员折扣购买
            let canLevelBuy = false;
            if (is_open_vipcard_buy == 1) {
              if (is_vip_card_member != 1 && is_member_level_buy == 1) canLevelBuy = true;
            } else {
              (is_member_level_buy == 1) && (canLevelBuy = true);
            }

            h = {
              ...h,
              rushList: rushList,
              pageEmpty: false,
              cur_time: res.data.cur_time,
              reduction,
              rushCategoryData: that.data.rushCategoryData,
              is_open_vipcard_buy: is_open_vipcard_buy || 0,
              is_vip_card_member,
              is_member_level_buy,
              canLevelBuy
            };
            h.vipInfo = { is_open_vipcard_buy, is_vip_card_member, is_member_level_buy };

            if (that.$data.pageNum == 1) h.resetScrollBarTop = 51;
            h.loadText = that.data.loadMore ? "加载中..." : "没有更多商品了~";
            that.$data.isSetCategoryScrollBarTop && (h.categoryScrollBarTop = 50 * h.rushCategoryData.activeIndex - (that.data.scrollViewHeight - 50) / 2);
            that.setData(h, function() {
              that.$data.loading = false, that.$data.pageNum += 1, !rushCategoryId && h.rushCategoryData.tabs && h.rushCategoryData.tabs[0] && (that.$data.rushCategoryId = h.rushCategoryData.tabs[0].id); //,that.setData({ resetScrollBarTop: 50 })
            })
          } else if (res.data.code == 1) {
            //无数据
            let s = {
              loadMore: false,
              canNext: true,
              // resetScrollBarTop: 50
            }
            if (that.$data.pageNum == 1) {
              console.log('无数据');
              s.pageEmpty = true;
            }
            that.setData(s);
          } else if (res.data.code == 2) {
            //no login
            that.setData({
              needAuth: true
            })
          }
          resolve(res);
        }
      })
    });
  },

  getPx: function(t) {
    return Math.round(app.globalData.systemInfo.windowWidth / 375 * t);
  },

  goResult: function(e) {
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
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    this.setData({
      tabbarRefresh: false,
      changeCarCount: false
    })
  },

  showDrop: function() {
    this.setData({
      showDrop: !this.data.showDrop
    })
  },

  get_cate_list: function() {
    let that = this;
    return new Promise((resolve, reject)=>{
      app.util.request({
        'url': 'entry/wxapp/index',
        'data': {
          controller: 'goods.get_category_list',
          is_type_show: 1
        },
        dataType: 'json',
        success: function(res) {
          if (res.data.code == 0) {
            let leftList = res.data.data || [];
            if(leftList.length==0){
              wx.hideLoading();
              that.setData({ noCateList: true })
              return;
            }

            //判断分类是否变化
            let cateNochange = false;
            let oldRushCategoryData = that.data.rushCategoryData;
            if(oldRushCategoryData && oldRushCategoryData.tabs && JSON.stringify(oldRushCategoryData.tabs) == JSON.stringify(leftList)) {
              cateNochange = true;
            }

            let rushCategoryId = that.$data.rushCategoryId || leftList && leftList[0] && leftList[0].id || 0;
            let active_index = 0;
            if (that.$data.rushCategoryId) {
              active_index = leftList.findIndex((p) => {
                return p.id == that.$data.rushCategoryId
              });
            }
            that.$data.rushCategoryId = rushCategoryId;
            let rushCategoryData = {
              tabs: leftList,
              activeIndex: active_index
            }
            let isFirstCategory = !rushCategoryData.activeIndex;
            let isLastCategory = rushCategoryData.activeIndex == rushCategoryData.tabs.length - 1;

            console.log('cateNochange', cateNochange);
            console.log('isFirst', that.isFirst);
            if(!cateNochange) {
              let h = {};
              if(that.isFirst > 1) {
                that.$data.pageNum = 1;
                rushCategoryData = {
                  tabs: leftList,
                  activeIndex: 0
                }
                isFirstCategory = true;
                isLastCategory = false;
                that.$data.rushCategoryId = leftList[0] && leftList[0].id || 0;
                h= {
                  rushList: [],
                  categoryScrollBarTop: 0,
                  resetScrollBarTop: 50,
                  loadMore: true,
                  loadText: "加载中...",
                  pageEmpty: false,
                  active_sub_index: 0
                };
              }
              that.setData({
                ...h,
                rushCategoryData,
                isFirstCategory,
                isLastCategory,
                noCateList: false
              }, () => {
                that.initPageData();
                wx.hideLoading();
              })
            }
          } else {
            // 分类不存在 todo
          }
          resolve();
        },
        fail: function(res) {
          reject(res)
        }
      })
    })
  },

  // 切换子栏目
  change_sub_cate: function(e) {
    let rushCategoryData = this.data.rushCategoryData;
    let tabs = rushCategoryData.tabs;
    let active_index = rushCategoryData.activeIndex; //当前大栏目选中索引
    let active_sub_index = e.currentTarget.dataset.idx; //当前子栏目选中索引
    let active_cate_id = tabs[active_index].id; //当前大栏目选中id
    let active_subcate_id = e.currentTarget.dataset.id || active_cate_id;
    let scrollLeft = this.getPx(64) * active_sub_index;
    console.log(scrollLeft);
    let that = this;
    that.$data.pageNum = 1;
    that.$data.rushCategoryId = active_subcate_id;
    that.setData({
      showDrop: false,
      active_cate_id: active_subcate_id,
      active_sub_index: active_sub_index,
      rushList: [],
      scrollLeft: scrollLeft,
      showEmpty: false,
      loadMore: true,
      loadText: '加载中',
      resetScrollBarTop: 50
    }, () => {
      that.getHotList();
    })
  },

  show_search: function() {
    wx.navigateTo({
      url: '/community/pages/type/search',
    })
  },

  /**
   * 加入购物车
   */
  openSku: function(t) {
    var that = this,
      e = t.detail;
    var goods_id = e.actId;
    var options = e.skuList;
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
      
      var cur_sku_arr = options.sku_mu_list[id] || {};
      cur_sku_arr.is_mb_level_buy = e.is_mb_level_buy || 0;
      cur_sku_arr.is_take_vipcard = e.is_take_vipcard || 0;

      that.setData({
        sku: arr,
        sku_val: 1,
        cur_sku_arr: cur_sku_arr,
        skuList: e.skuList,
        visible: true,
        showSku: true
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

  /**
   * 确认加入购物车
   */
  gocarfrom: function(e) {
    var that = this;
    var is_just_addcar = 1;
    wx.showLoading();
    a.collectFormIds(e.detail.formId);
    that.goOrder();
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
        if (res.data.code == 3) {
          wx.showToast({
            title: res.data.msg,
            icon: 'none',
            duration: 2000
          })
        } else if (res.data.code == 4) {
          wx.showToast({
            title: '您未登录',
            duration: 2000,
            success: () => {
              that.setData({
                needAuth: true
              })
            }
          })
        } else if (res.data.code == 6 || res.data.code == 7) {
          var msg = res.data.msg;
          let max_quantity = res.data.max_quantity || '';
          (max_quantity > 0) && that.setData({
            sku_val: max_quantity
          })
          wx.showToast({
            title: msg,
            icon: 'none',
            duration: 2000
          })
        } else {
          if (is_just_addcar == 1) {
            that.closeSku();
            (0, status.cartNum)(res.data.total);
            that.setData({
              cartNum: res.data.total
            })
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
    })

  },

  // 选择规格
  selectSku: function(event) {
    var that = this;
    let str = event.currentTarget.dataset.type;
    let obj = str.split("_");
    let arr = that.data.sku;
    let temp = {
      name: obj[3],
      id: obj[2],
      index: obj[0],
      idx: obj[1]
    };
    arr.splice(obj[0], 1, temp);
    that.setData({
      sku: arr
    })
    var id = '';
    for (let i = 0; i < arr.length; i++) {
      if (i == arr.length - 1) {
        id = id + arr[i]['id'];
      } else {
        id = id + arr[i]['id'] + "_";
      }
    }
    var options = this.data.skuList;
    var cur_sku_arr = options.sku_mu_list[id];

    that.setData({
      cur_sku_arr: cur_sku_arr
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
      if (ku_val > 1) {
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

  /**
   * 关闭购物车选项卡
   */
  closeSku: function() {
    this.setData({
      visible: 0,
      stopClick: false
    });
  },

  changeCartNum: function(t) {
    let that = this;
    let e = t.detail;
    (0, status.cartNum)(that.setData({
      cartNum: e
    }));
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    var community = wx.getStorageSync('community');
    var community_id = community.communityId || '';
    var member_id = wx.getStorageSync('member_id') || '';
    console.log("community/pages/type/index?community_id=" + community_id + '&share_id=' + member_id);
    return {
      path: "community/pages/type/index?community_id=" + community_id + '&share_id=' + member_id,
      success: function() {},
      fail: function() {}
    };
  }
})