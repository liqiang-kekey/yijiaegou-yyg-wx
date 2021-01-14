var util = require('common/resource/js/util.js');
var timeQueue = require('community/utils/timeQueue');
require('community/utils//mixins.js');

App({
  onLaunch: function () {
    // wx.hideTabBar();
    var userInfo = wx.getStorageSync("userInfo");
    this.globalData.userInfo = userInfo;
    var currentCommunity = wx.getStorageSync("community");
    this.globalData.hasDefaultCommunity = !!currentCommunity;
    this.globalData.community = currentCommunity;
    this.globalData.systemInfo = wx.getSystemInfoSync();
    var model = this.globalData.systemInfo.model;
 
    this.globalData.isIpx = model.indexOf("iPhone X") > -1 || model.indexOf("unknown<iPhone") > -1 || model.indexOf('iPhone 11') > -1;
    this.globalData.timer = new timeQueue.default();
  },
  // isIphone() {
  //   let info = wx.getSystemInfoSync();
  //   if (/iphone\sx/i.test(info.model) || (/iphone/i.test(info.model) && /unknown/.test(info.model)) || /iphone\s11/i.test(info.model)) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // },
  onShow: function () {
    this.getUpdate();
  },
  onHide: function () {},
  //加载微擎工具类
  util: util,
  //用户信息，sessionid是用户是否登录的凭证
  userInfo: {
    sessionid: null,
  },
  getCurrentPages: function(){
　　var pages = getCurrentPages();    //获取加载的页面
　　var currentPage = pages[pages.length - 1];  //获取当前页面的对象
　　var url = currentPage.route;  //当前页面url
　　var options = currentPage.options;   //获取url中所带的参数
　　//拼接url的参数
　　var currentPage= url + '?';
　　for (var key in options) {
　　　　var value = options[key]
　　　　currentPage+= key + '=' + value + '&';
　　}
　　currentPage = currentPage.substring(0, currentPage.length - 1);
　　return currentPage;
  },
  globalData: {
    systemInfo: {},
    isIpx: false,
    userInfo: {},
    canGetGPS: true,
    city: {},
    community: {},
    location: {},
    hasDefaultCommunity: true,
    historyCommunity: [],
    changedCommunity: false,
    disUserInfo: {},
    changeCity: "",
    timer: 0,
    formIds: [],
    community_id: '',
    placeholdeImg: '',
    cartNum: 0,
    cartNumStamp: 0,
    common_header_backgroundimage: '',
    appLoadStatus: 1, // 1 正常 0 未登录 2 未选择社区
    goodsListCarCount: [],
    typeCateId: 0,
    navBackUrl: '',
    isblack: 0,
    skin: {
      color: '#ff5344',
      subColor: '#ed7b3a',
      lighter: '#fff9f4'
    },
    goods_sale_unit: '件'
  },
  getUpdate: function () {
    if (wx.canIUse("getUpdateManager")) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(function (res) {
        res.hasUpdate && (updateManager.onUpdateReady(function () {
          wx.showModal({
            title: "更新提示",
            content: "新版本已经准备好，是否马上重启小程序？",
            success: function (t) {
              t.confirm && updateManager.applyUpdate();
            }
          });
        }), updateManager.onUpdateFailed(function () {
          wx.showModal({
            title: "已经有新版本了哟~",
            content: "新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~"
          });
        }));
      });
    } else wx.showModal({
      title: "提示",
      content: "当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。"
    });
  },
  getConfig: function () {
    var token = wx.getStorageSync('token');
    return new Promise((resolve, reject) => {
      util.request({
        url: 'entry/wxapp/user',
        data: {
          controller: 'index.get_firstload_msg',
          token,
          m: 'lionfish_comshop'
        },
        method: 'post',
        dataType: 'json',
        success: function (res) {
          if (res.data.code == 0) {
            let {
              new_head_id,
              default_head_info
            } = res.data;
            if (new_head_id > 0 && Object.keys(default_head_info).length) {
              wx.setStorageSync('community', default_head_info);
            }
            resolve(res)
          } else {
            reject()
          }
        }
      })
    })
  },
  siteInfo: require('siteinfo.js')
});