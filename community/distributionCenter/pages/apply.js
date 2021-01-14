var app = getApp();
var util = require('../../utils/util.js');
Page({
  mixins: [require('../../mixin/commonMixin.js')],

  /**
   * 页面的初始数据
   */
  data: {
    pickerIndex: 0,
    formArr: [],
    status: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.getMemberInfo();
  },

  /**
   * 授权成功回调
   */
  authSuccess: function() {
    let that = this;
    this.setData({
      needAuth: false
    }, () => {
      that.getMemberInfo();
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    let that = this;
    util.check_login_new().then((res) => {
      if (res) {
        that.setData({
          needAuth: false
        })
      } else {
        that.setData({
          needAuth: true
        })
      }
    })
  },

  getMemberInfo: function() {
    var token = wx.getStorageSync('token');
    let that = this;
    token && app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'user.get_user_info',
        token: token
      },
      dataType: 'json',
      success: function(res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          if(res.data.needAuth){
            util.clearUserSession();
          } 
          let commiss_diy_name = res.data.commiss_diy_name || '分销';
          wx.setNavigationBarTitle({
            title: `会员${commiss_diy_name}`,
          })
          //未开启分销
          if (res.data.commiss_level == 0) {
            wx.navigateTo({
              url: '/community/pages/user/me',
            })
            return;
          }
          //状态判断
          let userInfo = res.data.data;
          let status = 0; //未填写 1 已填写未审核 2 已审核
          if (res.data.commiss_biaodan_need==1){
            if (userInfo.is_writecommiss_form==1) {
              status = 1;
              //已填写
              if (userInfo.comsiss_flag == 1) {
                userInfo.comsiss_state == 0 ? status = 1 : status = 2;
              }
            }
          } else {
            status = 1
          }
          let formArr = [];
          let commiss_diy_form = res.data.commiss_diy_form;
          if (commiss_diy_form && commiss_diy_form.length > 0) {
            commiss_diy_form.forEach((item)=>{
              let value = '';
              if (item.type == 'text' || item.type == 'textarea') value = item.value;
              let formObj = {type: item.type, name: item.title, value, index: 0};
              formArr.push(formObj);
            })
          }
          that.setData({
            commiss_diy_form,
            userInfo,
            status,
            formArr,
            commiss_diy_name
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
   * 输入框获得焦点
   */
  iptFocus: function(t) {
    let name = t.currentTarget.dataset.name;
    this.setData({
      currentFocus: name
    })
  },

  /**
   * 输入框失去焦点
   */
  iptBlur: function() {
    this.setData({
      currentFocus: ''
    })
  },

  bindPickerChange(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    let formArr = this.data.formArr;
    let name = e.currentTarget.dataset.name;
    let index = e.currentTarget.dataset.idx;
    let pickIdx = e.detail.value;
    let commiss_diy_form = this.data.commiss_diy_form;
    let formObj = { type: 'select', name: commiss_diy_form[index].title, value: commiss_diy_form[index].value[pickIdx].value || '', index: pickIdx };
    formArr.splice(index, 1, formObj)
    this.setData({ formArr });
  },

  radioChange(e) {
    let formArr = this.data.formArr;
    let index = e.currentTarget.dataset.idx;
    let value = e.detail.value;
    let commiss_diy_form = this.data.commiss_diy_form;
    let formObj = { type: 'radio', name: commiss_diy_form[index].title, value };
    formArr.splice(index, 1, formObj)
    this.setData({ formArr });
    console.log('radio发生change事件，携带value值为：', e.detail.value)
  },

  checkboxChange(e) {
    let formArr = this.data.formArr;
    let index = e.currentTarget.dataset.idx;
    let value = e.detail.value;
    let commiss_diy_form = this.data.commiss_diy_form;
    let formObj = { type: 'checkbox', name: commiss_diy_form[index].title, value };
    formArr.splice(index, 1, formObj)
    this.setData({ formArr });
    console.log('checkbox发生change事件，携带value值为：', e.detail.value)
  },

  formSubmit: function(e){
    if (!this.authModal()) return;
    const params = e.detail.value;
    let formArr = this.data.formArr;
    let commiss_diy_form = this.data.commiss_diy_form;

    Object.keys(params).forEach((item)=>{
      let iptArr = item.split('-');
      let iptIdx = iptArr[1];
      let formObj = { type: commiss_diy_form[iptIdx].type, name: commiss_diy_form[iptIdx].title, value: params[item].replace(/^\s*|\s*$/g, "") }
      formArr.splice(iptIdx, 1, formObj)
      this.setData({ formArr });
    })
    console.log(formArr);
    for (var i = 0; i < formArr.length; i++) {
      let item = formArr[i];
      if (item.value == '') {
        let tip = '选择';
        if (item.type == 'text' || item.type == 'textarea') {
          tip = '输入';
        }
        wx.showToast({
          title: '请' + tip + item.name,
          icon: 'none'
        })
        return false;
      }
    }
    // [{ type: input, name: '姓名', value ='123'}]
    wx.showLoading({ title: '提交中' })
    var token = wx.getStorageSync('token');
    let that = this;
    app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'distribution.sub_distribut_form',
        token,
        data: formArr
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          that.setData({ status: 1 })
        } else {
          wx.showToast({
            title: '提交失败，请重试。',
            icon: 'none'
          })
        }
      }
    })

  },

  goLink: function(e) {
    let url = e.currentTarget.dataset.url;
    let type = '';
    if (url.indexOf('community/pages/user/me') != -1) {
      type = 'switch'
    }

    switch (type) {
      case "switch":
        wx.switchTab({
          url
        });
        break;
      default:
        wx.navigateTo({
          url
        });
    }
  }
})