import React from 'react';
import ReactDom from 'react-dom'

require('normalize.css/normalize.css');
require('../styles/App.scss');

// 获取图片数据
var imagesData = require('../data/imagesData.json');

// 给图片添加imageUrl属性
imagesData = (function(imagesArr){
  for(let i=0; i<imagesArr.length; i++){
    let singleImage = imagesArr[i];

    singleImage.imageUrl = require('../images/' + singleImage.fileName);

    imagesArr[i] = singleImage;
  }

  return imagesArr;
})(imagesData);

/*
 * 获取区间内的随机值
 */
function getRangeRandom(low, high){
  return Math.ceil(Math.random() * (high - low) + low)
}

/*
 * 获取0~30之间的任意正负随机数
 */
function get30DegRandom(){
  return (Math.random() > 0.5 ? '' : '-') + Math.ceil(Math.random() * 30)
}

class ImageFigure extends React.Component {
  /*
   * imageFigure 的点击处理函数
   */
  handleClick(e) {
    if (!this.props.arrange.isCenter){
      this.props.center();
    }else{
      this.props.inverse();
    }

    e.stopPropagation();
    e.preventDefault();
  }

  render() {
    var styleObj = {};

    // 如果props指定了这张图片的位置, 则使用
    if (this.props.arrange.pos) {
      styleObj = this.props.arrange.pos
    }

    // 如果图片旋转角度不为0, 则添加旋转角度
    if (this.props.arrange.rotate) {
      styleObj['transform'] = 'rotate(' + this.props.arrange.rotate + 'deg)'
    }

    // 如果是居中图片, z-index设为11
    if (this.props.arrange.isCenter){
      styleObj.zIndex = 11
    }

    var imgFigureClassName = 'img-figure';
        imgFigureClassName += this.props.arrange.isInverse ? ' is-inverse' : '';

    return (
      <figure className={imgFigureClassName} style={styleObj} onClick={this.handleClick.bind(this)}>
        <img src={this.props.data.imageUrl}
             alt={this.props.data.title}
        />
        <figcaption>
          <h2 className="img-title">{this.props.data.title}</h2>
          <div className="img-back" onClick={this.handleClick.bind(this)}>
            <p>
              {this.props.data.desc}
            </p>
          </div>
        </figcaption>
      </figure>
    )
  }
}

class ControllerUnit extends React.Component{
  handleClick(e) {

    if (this.props.arrange.isCenter) {
      this.props.inverse()
    }else{
      this.props.center()
    }
    e.preventDefault();
    e.stopPropagation()
  }

  render() {
    var controllerUnitClassName = 'controller-unit';

    if (this.props.arrange.isCenter) {
      controllerUnitClassName += ' is-center';

      if (this.props.arrange.isInverse){
        controllerUnitClassName += ' is-inverse'
      }
    }
    return (
      <span className={controllerUnitClassName} onClick={this.handleClick.bind(this)}></span>
    )
  }
}

class AppComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      imgArrangeArr: [
        /*{
            pos: {
              left: 0,
              top: 0
            },
            rotate: 0, // 旋转角度
            isInverse: false // 图片正反面
            isCenter: false // 图片是否居中
         }*/
      ]
    };

    this.Constant = {
      centerPos: {
        left: 0,
        right: 0
      },
      hPosRange: {  // 水平方向的取值范围
        leftSecX: [0, 0],
        rightSecX: [0, 0],
        y: [0, 0]
      },
      vPosRange: {  // 垂直方向的取值范围
        x: [0, 0],
        topY: [0, 0]
      }
    }
  }

  // 组件加载后为每个图片计算其位置范围
  componentDidMount(){
    // 舞台大小
    var stageDOM = ReactDom.findDOMNode(this.refs.stage),
        stageW = stageDOM.scrollWidth,
        stageH = stageDOM.scrollHeight,
        halfStageW = Math.ceil(stageW / 2),
        halfStageH = Math.ceil(stageH / 2);

    // imageFigure大小
    var imageFigureDOM = ReactDom.findDOMNode(this.refs.imageFigure0),
        imgW = imageFigureDOM.scrollWidth,
        imgH = imageFigureDOM.scrollHeight,
        halfImgW = Math.ceil(imgW / 2),
        halfImgH = Math.ceil(imgH / 2);

    // 计算中心图片的位置点
    this.Constant.centerPos = {
      left: halfStageW - halfImgW,
      top: halfStageH - halfImgH
    };

    // 计算左侧, 右侧区域图片位置的取值范围
    this.Constant.hPosRange.leftSecX[0] = - halfImgW;
    this.Constant.hPosRange.leftSecX[1] = halfStageW - halfImgW * 3;
    this.Constant.hPosRange.rightSecX[0] = halfStageW + halfImgW;
    this.Constant.hPosRange.rightSecX[1] = stageW - halfImgW;
    this.Constant.hPosRange.y[0] = - halfImgH;
    this.Constant.hPosRange.y[1] = stageH - halfImgH;

    // 计算上侧区域图片位置的取值范围
    this.Constant.vPosRange.topY[0] = - halfImgH;
    this.Constant.vPosRange.topY[1] = halfStageH - halfImgH * 3;
    this.Constant.vPosRange.x[0] = halfStageW - imgW;
    this.Constant.vPosRange.x[1] = halfStageW;

    this.rearrange(0);
  }

  /*
   * 翻转图片
   * @param: index 当前被执行inverse操作图片在数组中的index值
   * return: {Function} 一个闭包函数, 返回真正要执行的函数
   */
  inverse(index) {
    return function() {
      var imgArrangeArr = this.state.imgArrangeArr;

      imgArrangeArr[index].isInverse = !imgArrangeArr[index].isInverse;

      this.setState({
        imgArrangeArr: imgArrangeArr
      })
    }.bind(this)
  }

  /*
   * 重新布局所有图片
   * @param centerIndex 指定居中哪个图片
   */
  rearrange(centerIndex) {
    var imgArrangeArr = this.state.imgArrangeArr,
        Constant = this.Constant,
        centerPos = Constant.centerPos,
        hPosRange = Constant.hPosRange,
        vPosRange = Constant.vPosRange,
        hPosRangeLeftSecX = hPosRange.leftSecX,
        hPosRangeRightSecX = hPosRange.rightSecX,
        hPosRangeY = hPosRange.y,
        vPosRangeTopY = vPosRange.topY,
        vPosRangeX = vPosRange.x,

        imgArrangeTopArr = [],
        topImgNum = Math.floor(Math.random() * 2),  // 取0~1个
        topImgSpliceIndex,

        imgArrangeCenterArr = imgArrangeArr.splice(centerIndex, 1);

    // 居中 centerIndex 图片
    imgArrangeCenterArr[0] = {
      pos: centerPos,
      rotate: 0,
      isCenter: true
    };

    // 取出要布局上侧图片的状态信息
    topImgSpliceIndex = Math.ceil(Math.random() * (imgArrangeArr.length - topImgNum));
    imgArrangeTopArr = imgArrangeArr.splice(topImgSpliceIndex, topImgNum);

    // 布局位于上侧的图片
    imgArrangeTopArr.forEach(function (value, index) {
      imgArrangeTopArr[index] = {
        pos: {
          top: getRangeRandom(vPosRangeTopY[0], vPosRangeTopY[1]),
          left: getRangeRandom(vPosRangeX[0], vPosRangeX[1])
        },
        rotate: get30DegRandom()
      }
    });

    // 布局左右两侧图片
    for(var i = 0, j = imgArrangeArr.length, k = j/2; i < j; i++){
      var hPosRangeLORX = null;

      // 前半部分布局左边, 右半部分布局右边
      if (i < k){
        hPosRangeLORX = hPosRangeLeftSecX
      }else{
        hPosRangeLORX = hPosRangeRightSecX
      }

      imgArrangeArr[i] = {
        pos: {
          top: getRangeRandom(hPosRangeY[0], hPosRangeY[1]),
          left: getRangeRandom(hPosRangeLORX[0], hPosRangeLORX[1])
        },
        rotate: get30DegRandom()
      }
    }

    if (imgArrangeTopArr && imgArrangeTopArr[0]){
      imgArrangeArr.splice(topImgSpliceIndex, 0, imgArrangeTopArr[0])
    }

    imgArrangeArr.splice(centerIndex, 0, imgArrangeCenterArr[0]);

    this.setState({
      imgArrangeArr: imgArrangeArr
    });
  }

  /*
   * 利用rearrange函数, 居中对应的图片
   * @param index, 需要被居中的图片的index
   * @return {Function}
   */
  center(index) {
    return function(){
      this.rearrange(index)
    }.bind(this);
  }

  render() {
    var imageFigures = [],
        controllerUnits = [];

    imagesData.forEach(function(value, index){
      if (!this.state.imgArrangeArr[index]){
        this.state.imgArrangeArr[index] = {
          pos: {
            left: 0,
            top: 0
          },
          rotate: 0,
          isInverse: false,
          isCenter: false
        }
      }

      imageFigures.push(
        <ImageFigure data={value} ref={'imageFigure' + index}
                     arrange={this.state.imgArrangeArr[index]}
                     center={this.center(index)}
                     inverse={this.inverse(index)}/>);

      controllerUnits.push(<ControllerUnit arrange={this.state.imgArrangeArr[index]}
                                           inverse={this.inverse(index)}
                                           center={this.center(index)}
      />)
    }.bind(this));


    return (
      <section className="stage" ref="stage">
        <section className="img-sec">
          {imageFigures}
        </section>
        <nav className="controller-nav">
          {controllerUnits}
        </nav>
      </section>
    );
  }
}

export default AppComponent;
