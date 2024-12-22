const util = require('../../utils/util')


Page({
  data: {
    image: "",
    info: {
      src_path: '/product-manage/12', // 路径
      url: '//upload-1259129443.cos.ap-guangzhou.myqcloud.com/12_3_5a39773610c690a655d26851f6d49086.jpg?imageMogr2/quality/40', // 图片地址
      title: '有礼喜坊', // 标题
      desc1: ['乔迁之喜礼盒'],
      desc2: ['2024/12/18 23:59']
    },
    paintPallette: {
      width: '700rpx',
      height: '1000rpx',
      background: '#ffffff',
      views: [
        {
          id: `image-1`,
          type: 'image',
          url: 'https://upload-1259129443.cos.ap-guangzhou.myqcloud.com/12_3_5a39773610c690a655d26851f6d49086.jpg?imageMogr2/quality/40',
          css: {
            top: `0rpx`,
            left: `0rpx`,
            width: '100%',
            height: '700rpx',
          },
        },
        {
          id: 'image-2',
          type: 'image',
          url: '/assets/WechatIMG670.jpg',
          css: {
            top: '750rpx',
            left: '450rpx',
            width: '200rpx',
            height: '200rpx'
          }
        },
        {
          type: 'text',
          text: '时礼伴手礼',
          css: {
            top: '750rpx',
            left: '50rpx',
            fontSize: '40rpx',
            width: '400rpx',
            maxLines: '1'
          }
        },
        {
          type: 'text',
          text: '报价单',
          css: {
            top: '820rpx',
            left: '50rpx',
            fontSize: '32rpx',
            width: '400rpx',
            maxLines: '1',
            color: '#aaaaaa'
          }
        },
        {
          type: 'text',
          text: '2024/12/12 12:24',
          css: {
            top: '900rpx',
            left: '50rpx',
            fontSize: '24rpx',
            width: '400rpx',
            maxLines: '1',
            color: '#aaaaaa'
          }
        }
      ]
    }
  },
  async onLoad({payload}) {

  },
  onImgOK(e) {
    console.log(e)
    this.setData({
      image: e.detail.path,
    });
  }
})
