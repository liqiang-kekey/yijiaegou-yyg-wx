// community/pages/suyuan/live.js
const date = require('../../utils/date.js')
const md5 = require('../../utils/md5.js')
var app = getApp();
//
var detailClearTime = null;

function count_down(that, second) {
  var second = Math.floor(second);

  that.setData({
      loadingtime: '溯源视频正在加载中......'+fill_zero_prefix(second)+'s',
  });

  if (second <= 0) {
    clearTimeout(detailClearTime);
    detailClearTime = null;
    that.setData({
      loadingtime:'即将打开视频',
    });
    return;
  }

  detailClearTime = setTimeout(function() {
    second -= 1;
    count_down(that, second);
  }, 1000)

}
// 位数不足补零
function fill_zero_prefix(num) {
  return num < 10 ? "0" + num : num
}

//
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cameraid:0,
    hlsurl:'',
    poster:'',
    devsn:'',
    //视频是否已就绪
    isReady: false,
    ifShowWeb:false,
    loadingtime:'',
    loadingInterval:null,
    suyuanimg:'',
  },
 // 当前播放视频信息
 video: {
  // 播放器对象
  player: null,
  // 资源地址
  hlsurl: null,
  // 资源是否可用
  available: 0,
  // 播放状态
  state: '',
  // 当前播放位置
  currentTime: 0,
  // 最后播放位置
  lastTime: 0,
  // 持续播放时间
  duration: 0,
  // 持续播放时间限制(秒),0表示不限制
  timeout: 600,
  // 心跳连接服务器间隔时间(秒)
  heartbeatIntervalTime: 300,
  // 最后一次心跳请求时间戳
  heartbeatTimestamp: 0,
  // 心跳请求结果:成功或失败
  heartbeatResult: 0,
  // 重载定时器
  monitorInterval: null,
  // 允许最大重载次数
  reloadLimitTimes: 10,
  // 已重载次数
  reloadTimes: 0,
},
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('onLoad');
    var that = this;
    /*
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'index.get_camera_info',
        devsn:options.sn,
      },
      method: 'POST',
      dataType: 'json',
      success(res) {
        //console.log("心跳结果:"+that.data.sn);
        console.log(res.data);
        if (res.data.result == 0) {
          //that.video.heartbeatTimestamp = date.timestamp()
          //that.video.heartbeatResult = 1
          //console.log("心跳连接成功,连接时间:", that.video.heartbeatTimestamp)
          //
          that.setData({
            hlsurl:res.data.hlsurl,
            poster:res.data.imgsrc,
            devsn: options.sn,
            //视频是否已就绪
            isReady: true,
          })
        }
      }
    })
    */
    //
    var devlist_sync = wx.getStorageSync('devlist');
    var index = 0;
    for (var i = 0; i < devlist_sync.length; i++) {
      if(devlist_sync[i].sn == options.sn)
      {
        console.log(devlist_sync[i].hlsurl);
        index = i;
        that.setData({
          hlsurl:devlist_sync[i].hlsurl,
          poster:devlist_sync[i].imgsrc,
          devsn: devlist_sync[i].sn,
          cameraid:devlist_sync[i].id,
          //视频是否已就绪
          isReady: true,
        })
       break;
      }
    }
    //获取溯源图片
    var cameraid_t = devlist_sync[index].id;
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'index.get_suyuan_pic',
      },
      method: 'POST',
      dataType: 'json',
      success(res) {
        console.log(res.data);
        if (res.data.code == 0) {
          if(cameraid_t == 14107)
          {
            that.setData({
            suyuanimg: res.data.image1,
            })
          }
          if(cameraid_t == 14106)
          {
            that.setData({
            suyuanimg: res.data.image2,
            })
          }
          if(cameraid_t == 10406)
          {
            that.setData({
            suyuanimg: res.data.image3,
            })
          }
        }
      }
    })
    //
    wx.setNavigationBarTitle({
      title: devlist_sync[index].name
    });
    //
    //this.data.loadingInterval = setInterval(this.monitor2, 2000);
    //
    count_down(that, 15);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log("page onReady")
    this.video.player = wx.createVideoContext('myVideo')
    this.video.player.play();
    // 缓存视频资源地址
    this.video.hlsurl = this.data.hlsurl
    // 建立首次心跳
    this.heartbeatRequest()
    // 开始监控进程,初始化等待3秒
    this.video.monitorInterval = setInterval(this.monitor, 3000)

  },

  /**
   * 生命周期函数--监听页面显示
   */
  // 页面显示时,当手机屏幕重新点亮后
  onShow() {
    console.log("page onShow")
    //用于再次显示后,如资源可用,则继续播放
    if (this.video.available) {
      this.play()
    }
  },


  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log("page onHide")
    // this.pause()
    this.stop()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log("page onUnload")
    this.stop()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log("page onPullDownRefresh")
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
    // 播放中或手动点击播放按钮后
    onPlay() {
      this.video.state = "onPlay"
      console.log("onPlay播放状态: ", this.video.state)
    },
  
    // 暂停播放
    onPause() {
      this.video.state = "onPause"
      console.log("onPause播放状态: ", this.video.state)
    },
  
    //结束播放
    onEnded() {
      this.video.state = "onEnded"
      console.log("onEnded播放状态: ", this.video.state)
      this.video.available = 0
    },
  //播放进度改变时,250ms触发一次
  onTimeUpdate(event) {
    //console.log('onTimeUpdate'+event.detail)
    // 播放进度
    this.video.currentTime = event.detail.currentTime
    // 持续时间
    this.video.duration = event.detail.duration
    // 监控播放进度
    this.video.available = 1
  },
  // 全屏状态改变
  onFullScreenChange(event) {
    console.log("onFullScreenChange", event.detail)
  },

  // 等待播放或缓冲时
  onWaiting() {
    this.video.state = "onWaiting"
    console.log("onWaiting播放状态: ", this.video.state)
  },

  // 视频播放出错时
  onError() {
    this.video.state = "onError"
    console.log("onError播放状态: ", this.video.state)
    this.video.available = 0
  },
  
  // 加载进度变化时,不能设置状态,否则会导致暂停后仍然播放的BUG
  onProgress(event) {
    //this.video.state = "onProgress"
    console.log("onProgress播放状态: ", this.video.state)
    this.video.available = 1
  },
    // 控制播放
    play() {
      console.log("播放控制: play")
      // 如视频未就绪,则重新渲染
      var that = this
      if (!this.data.isReady) {
        console.log("224-hlsurl:"+this.video.hlsurl);
        this.setData({
          isReady: true,
          hlsurl: this.video.hlsurl
        },function(){
          console.log("229-渲染成功后回调控制播放");
          // 渲染成功后回调控制播放
          that.video.player.play();
        })
      } else { //同步控制播放
        console.log("234-同步控制播放");
        this.video.player.play()
      }
    },
  
    // 控制暂停
    pause() {
      console.log("播放控制: pause")
      this.video.player.pause()
  
    },
  
    // 控制结束
    stop() {
      console.log("播放控制: stop")
      // stop方法对直播的支持不够,需要清空播放地址以避免持续下载视频文件
      this.video.player.pause()
      this.video.player.stop()
      clearInterval(this.video.monitorInterval)
      this.setData({
        isReady: false,
        hlsurl: ''
      })
      // 重置播放信息
      this.video.available = 0
      this.video.state = ''
      this.video.currentTime = 0
      this.video.lastTime = 0
      this.video.duration = 0
      this.video.reloadTimes = 0
    },
  //加载视频进程
  monitor2() {
    var that = this;
    var timer2 = 2000;
    var temptime = that.data.loadingtime - 1;
    if(temptime>=0)
    {
      that.setData({
        loadingtime:temptime,
      });
      this.data.loadingInterval = setInterval(this.monitor2, timer2)
    }
    else
    {
      clearInterval(this.data.loadingInterval);
      return;
    }
  },
  //
  // 监控进程
  monitor() {
    var timer = 10000
    //重置定时器
    clearInterval(this.video.monitorInterval)

    // 播放超时或请求次数超限时,停止播放并停止监控
    if (this.video.reloadTimes > this.video.reloadLimitTimes || this.video.timeout && this.video.duration >= this.video.timeout) {
      console.log("播放超时或超限,连续重载", this.video.reloadTimes, "次,持续播放", this.video.duration, "秒")
      this.stop()
      return
    }
    console.log('274'+this.data.isReady+'available:'+this.video.available);
    // 视频未就绪,重新渲染播放器
    if(!this.data.isReady) {
      console.log("276", this.data.isReady)
      this.play()
      timer = 10000
    }
    // 资源不可用时,重置播放器,即设置为未就绪状态,重新渲染
    else if (!this.video.available) {
      if(this.video.reloadTimes<1)
      {
        this.video.player.pause()
        this.video.player.stop()
        this.setData({
          isReady: false,
          hlsurl: ''
        })
      }
      else
      {
        clearInterval(this.video.monitorInterval);
        this.stop();
        this.setData({
          ifShowWeb: true,
        })
        return;
      }
      this.video.reloadTimes++
      console.log("资源第", this.video.reloadTimes, "次重载")
      timer = 10000
    }
    // 暂停播放
    else if (this.video.state === 'onPause') {
      timer = 10000
    }
    // 播放进度停滞,尝试控制播放,并设置资源不可用,如在下次监控时仍未恢复则重置播放器
    else if (this.video.lastTime === this.video.currentTime) {
      this.play()
      this.video.available = 0
      timer = 10000
    }
    // 其它状态:播放中,缓冲中..,重置定时器,并开始计算心跳
    else {
      console.log("播放进度: ", this.video.currentTime)
      this.video.reloadTimes = 0
      this.heartbeatRequest()
      timer = 10000
    }

    // 更新最后一次播放时间
    this.video.lastTime = this.video.currentTime;
    console.log("currentTime:311"+this.video.currentTime);
    // 下一轮监控
    this.video.monitorInterval = setInterval(this.monitor, timer)
  },

  // 心跳连接
  heartbeatRequest() {
    // 心跳状态检测: 已请求成功且时间间隔小于设定时间内不再请求
    if (this.video.heartbeatResult && date.timestamp() - this.video.heartbeatTimestamp < this.video.heartbeatIntervalTime) {
      return
    }
    
    // 重置心跳请求结果
    this.video.heartbeatResult = 0
    console.log("发送心跳连接,上次成功连接时间:", this.video.heartbeatTimestamp)

    var that = this
   console.log('dev:'+that.data.devsn);
   wx.request({
      url: 'https://cdn88.cn/api/?cmdId=210&user=sxyk&dev='+that.data.devsn,
      /*
      data: {
        cmdId:210,
        user:'demo',
        dev:that.data.devsn,
      },
      */
      method: 'POST',
      success(res) {
        console.log("心跳连接");
        console.log(res.data);
        if (res.data.result == 0) {
          that.video.heartbeatTimestamp = date.timestamp()
          that.video.heartbeatResult = 1
          console.log("心跳连接成功,连接时间:", that.video.heartbeatTimestamp)
          console.log(res.data.hlsurl);
        }
      }
    })
  },

})
 