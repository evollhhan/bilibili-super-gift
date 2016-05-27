// TODO: Haven't translated to English yet
// combo Class
// 连击效果类
this.combo = this.combo || {};

(function(){

	/**
	 * 动画配置参数
	 **/	
	combo.FPS = 60,					// 动画帧率

	combo.GIFSPEED = 8,				// gif动画帧速率（值越小速度越快）

	combo.SHAPE_DURATION = 4,		// 动画最长持续时间

	combo.INSERTTIMELIMIT = 24,		// 道具插入时间间隔

	combo.MAX = 3,					// 道具显示最大数量

	combo.SIZEQUEUE = 10, 			// 队列大小（超过队列长度将选取最近的10个）

	combo.HEIGHT = 80,				// 道具高度

	combo.OFFSETX = 30,				// X偏移量

	/**
	 * 初始化道具配置参数
	 **/
	combo.poolId = 1,			// 连击道具自增Id

	combo.poolIn = {},			// 道具池（进入或正在动画的）

	combo.poolCache = {},		// 道具池（缓存的）

	combo.poolQueue = [],		// 道具池（等待进入动画队列的）

	combo.ListIn = [],			// 道具池Id列表（进入或正在动画的）

	combo.countIn = 0,			// 当前道具数量（进入或正在动画的）

	combo.countCache = 0,		// 当前道具数量（缓存的）

	combo.countQueue = 0,		// 当前道具数量（等待进入动画队列的）

	combo.resetPositionLock = 0,				// 重置道具位置动画锁

	combo.insertTimer = combo.INSERTTIMELIMIT;	// 道具插入时间间隔

	/**
	 * 根据指定参数创建一个连击对象
	 * @info 	{object}	道具信息
	 * @aCloud 	{object}	道具云样式
	 * @aCross 	{object}	道具x样式
	 * @aText 	{Array}		道具字体样式
	 * @return Gift道具对象
	 **/
	combo.draw = function(info, aCloud, aCross, aText, aSender, aGif) {

		var gift = {
				timer: 0,
				lock: 0,
				$id: info.$id
			},
			container = new createjs.Container(),
			_defaultCloud = {
				scaleX: 0.8,				// X 缩放
				scaleY: 0.8,				// Y 缩放
				alpha: 0,					// 透明度
				x: combo.OFFSETX + 160,		// X 轴位置
				y: combo.HEIGHT,			// Y 轴位置
				regX: 124,					// 变化中心点 X
				regY: 28,					// 变化中心点 Y
				strokeColor: '#fff',		// 描边颜色
				strokeSize: 5,				// 描边大小
				front: '#fff',				// 前景色
				back: '#fff',				// 背景色
				bgImage: null				// 背景图片
			},
			_defaultCross = {
				scaleX: 0.8,
				scaleY: 0.8,
				alpha: 0,				
				x: combo.OFFSETX + 300,
				y: combo.HEIGHT,
				regX: 260,
				regY: 28,
				color: '#fff'
			},
			_defaultText = {
				scaleX: 0.8,
				scaleY: 0.8,
				alpha: 0,				
				x: combo.OFFSETX + 0,
				y: combo.HEIGHT,
				regX: 4,
				regY: 16,
				skewX: 0,
				skewY: 0,
				font: '12px Arial',
				color: '#fff',
				text: ''
			},
			_defaultGif = {
				scaleX: 0.9,
				scaleY: 0.9,
				alpha: 0,				
				x: combo.OFFSETX + 46,
				y: combo.HEIGHT,
				regX: 40,
				regY: 10,
				f: 0
			},
			optMask = {
				scaleX: 0.8,
				scaleY: 0.8,
				alpha: 0,
				x: combo.OFFSETX + 76,
				y: combo.HEIGHT,
				regX: 40,
				regY: 16,
				custom: {
					moveY: 16
				}
			},
			optCloud = $.extend({}, _defaultCloud, aCloud),
			optCross = $.extend({}, _defaultCross, aCross),
			optGif = $.extend({}, _defaultGif, aGif),
			optText = [],
			aTextLen = aText.length;
		if( aTextLen ) {
			for( var i = 0; i < aTextLen; i++ ) {
				optText.push( $.extend({}, _defaultText, aText[i]) );
			}
		}

		// Cloud here
		var shape_g;
		if( optCloud.bgImage ) {
			shape_g = new createjs.Bitmap(optCloud.bgImage);		
		}
		else {
			shape_g = combo.createShapeCloud(optCloud);
		}
		shape_g.set({
			scaleX: optCloud.scaleX,
			scaleY: optCloud.scaleY,
			alpha: optCloud.alpha,
			x: optCloud.x,
			y: optCloud.y,
			regX: optCloud.regX,
			regY: optCloud.regY,	
			name: 'cloud'			
		});
		container.addChild(shape_g);

		// Gif Here
		var b = new createjs.Bitmap(optGif.src);
		b.sourceRect = new createjs.Rectangle(0, 0, 60, 60);
		b.set({
			scaleX: optGif.scaleX,
			scaleY: optGif.scaleY,
			alpha: optGif.alpha,
			x: optGif.x,
			y: optGif.y + optGif.custom.moveY,
			regX: optGif.regX,
			regY: optGif.regY,
			name: 'gif'
		});
		var m = new createjs.Graphics(); 
		m.setStrokeStyle(3)
		 .beginStroke(optCloud.strokeColor)
		 .beginFill(null)
		 .a(0, 0, 30, 0, Math.PI*2);
		var shape_m = new createjs.Shape(m);
		shape_m.set({
			scaleX: optMask.scaleX,
			scaleY: optMask.scaleY,
			alpha: optMask.alpha,
			x: optMask.x,
			y: optMask.y + optMask.custom.moveY,
			regX: optMask.regX,
			regY: optMask.regY,
			name: 'mask'
		});
		b.mask = shape_m;
		container.addChild(b, shape_m);
		gift.gifSequence = {
			k: 0,
			t: 0,
			f: optGif.f
		};

		// Cross Here
		var shape_c = combo.createShapeCross(optCross);
		shape_c.set({
			scaleX: optCross.scaleX,
			scaleY: optCross.scaleY,
			alpha: optCross.alpha,
			x: optCross.x,
			y: optCross.y,
			regX: optCross.regX,
			regY: optCross.regY,
			name: 'cross'
		});
		container.addChild(shape_c);

		// Text Here
		var t = {};
		for( i = 0; i < aTextLen; i++ ) {
			t = new createjs.Text();
			t.set({
				scaleX: optText[i].scaleX,
				scaleY: optText[i].scaleY,
				alpha: optText[i].alpha,
				x: optText[i].x,
				y: optText[i].y + optText[i].custom.moveY,
				regX: optText[i].regX,
				regY: optText[i].regY,
				skewX: optText[i].skewX,
				skewY: optText[i].skewY,
				text: optText[i].text,
				font: optText[i].font,
				color: optText[i].color,
				name: 'text' + i
			});
			container.addChild(t);
		}

		// Sender Info here
		var sender = new createjs.Container(),
			s_text = new createjs.Text();
		// sender name
		s_text.set({
			x: 0,
			text: aSender.uname,
			font: aSender.font,
			color: aSender.color,
			name: 'senderName'
		});
		sender.addChild(s_text);
		// sender gift
		s_text = new createjs.Text();
		s_text.set({
			x: 70,
			text: aSender.action + aSender.giftName,
			font: aSender.font,
			color: '#000',
			name: 'senderGift'
		});
		sender.addChild(s_text);
		// sender num
		s_text = new createjs.Text();
		s_text.set({
			x: 100 + combo.getTextLength(aSender.giftName)*11,
			text: aSender.num + '个',
			font: aSender.font,
			color: aSender.color,
			name: 'senderNum'
		});
		sender.addChild(s_text);
		sender.set({
			scaleX: 0.8,
			scaleY: 0.8,
			alpha: 0,
			x: combo.OFFSETX + 144,
			y: combo.HEIGHT + aSender.custom.moveY,
			regX: 72,
			regY: 10,
			name: 'sender'
		});
		container.addChild(sender);

		container.y = info.y;
		gift.container = container;
		return gift;
	}

})();

$(function(){
	
	var stage = new createjs.Stage('giftArea');  // 舞台初始化

	createjs.Ticker.setFPS(combo.FPS);			 //	设定帧率

	// 模拟广播触发道具事件
	$('.send').click(function(e){

		var r = Math.round(Math.random()*10);
		if( r < 1 ) r = 1;
		if( r > 8 ) r -= 8;

		/* TODO: 正式环境下data传入的为道具参数
		 * 参数格式如Temp Data
		 * @$id			{string}	道具标识ID
		 * @giftId 		{number}	道具Id
		 * @giftName	{string}	道具名称
		 * @super 		{number}	道具连击数
		 * @uid 		{number}	用户Id
		 * @uname 		{string}	用户名称
		 * @action 		{string}	用户行为
		 * @num 		{number}	道具数
		 * @pos 		{number}	道具位置
		 **/
		var data = {
			giftId: r,
			giftName: combo.lib[r].giftName,
			super: combo.poolId++,
			uid: 4691223,
			uname: '我是验证码',
			action: '赠送',
			num: 1314
		};
		data.pos = combo.HEIGHT * combo.countIn;
		data.$id = data.uid + '_' + data.giftId;
		data.uname = combo.textEllipsis(data.uname);

		// 判断是否有动画道具
		if( !combo.countIn ) {
			createjs.Ticker.addEventListener('tick', stage);
			createjs.Ticker.addEventListener('tick', handleTick);
		}

		// 判断道具是否正在动画
		else if( combo.poolIn.hasOwnProperty(data.$id) ) {	
			updateVisualCombo(data);
			return 0;
		}

		// 判断道具是否在缓冲列表
		else if( combo.poolCache.hasOwnProperty(data.$id) ) {
			combo.poolCache[data.$id].timer = combo.FPS * combo.SHAPE_DURATION;
			combo.poolQueue.push(data);
			combo.countQueue++;
			return 0;
		}

		// 当连击道具超过最大值时，加入等待队列
		else if( combo.insertTimer < combo.INSERTTIMELIMIT || combo.countIn >= combo.MAX ) {
			combo.poolQueue.push(data);
			combo.countQueue++;
			return 0;
		}		

		// 当连击道具未达到最大值时，加入动画列表
		comboConstructor(data);

	});

	// 初始化道具对象
	function comboConstructor(data) {

		var info = { 
				$id: data.$id,
				y: data.pos
			},
			cross = {
				color: '#ff2a00',
			},
			gif = {
				src: combo.lib[data.giftId].src,
				k: 0,
				f: combo.lib[data.giftId].f - 1,
				custom: {
					moveY: -20
				}
			},
			text = [
				{
					color: '#ff2a00',
			    	x: combo.OFFSETX + 315,
					skewX: 10,
					text: data.super,
					font: 'bold 30px Arial',
					custom: {
						moveY: -5
					}
				},
				{
					color: '#ff2a00',
					x: combo.OFFSETX + 305,
					skewX: 10,
					text: 'combo',
					font: 'bold 16px Arial',
					custom: {
						moveY: 25
					}
				}
			],
			sender = {
				uname: data.uname,
				action: data.action,
				giftName: data.giftName,
				num: data.num,
				color: combo.lib[data.giftId].fontColor,
				font: '14px Microsoft Yahei',
				custom: {
					moveY: 0
				}
			};
        var cloud = {};
        if( combo.lib[data.giftId].bgImage ) {
            cloud = { bgImage: combo.lib[data.giftId].bgImage }
        }
        else {
            cloud = {
                front: combo.lib[data.giftId].front,
                back: combo.lib[data.giftId].back            
            }
        };
		combo.poolIn[info.$id] = combo.draw(info, cloud, cross, text, sender, gif);
		stage.addChild(combo.poolIn[info.$id].container);
		animateComboIn(combo.poolIn[info.$id].container);
		combo.ListIn.push(info.$id);
		combo.countIn++;
		combo.insertTimer = 0;
	}

	/**
	 * 动画线程
	 **/
	function handleTick() {

		try{

			combo.insertTimer++;

			// 如果无道具，移除监听事件
			if( !combo.countIn&& !combo.countCache ) {
				createjs.Ticker.removeEventListener('tick', handleTick);
			}

			// 检查队列道具状态
			if( combo.countQueue > combo.SIZEQUEUE ) {
				combo.poolQueue.splice(1);
				combo.countQueue = combo.SIZEQUEUE;
			}
			if( combo.countQueue && combo.insertTimer >= combo.INSERTTIMELIMIT ) {
				if( combo.countIn >= combo.MAX ) {
					combo.poolIn[combo.ListIn[0]].timer = combo.FPS * combo.SHAPE_DURATION;
				}
				else {
					insertVisualCombo();
				}
			}

			// 检查动画列表
			if( combo.countIn ) {
				for( var i in combo.poolIn )
					checkVisualComboState(combo.poolIn[i]);
			}
			else {
				createjs.Ticker.removeEventListener('tick', stage);
			}

			// 检查缓存列表
			if( combo.countCache ) {
				for( var i in combo.poolCache )
					checkCacheComboState(combo.poolCache[i]);
			}

			// if( combo.poolId === 20 ) combo.poolIn = {};
			// console.log(stage.children.length);

		}
		catch (err) {
			resetAllCombo(err);
		}
	}

	/**
	 * 检查可视道具状态
	 **/
	function checkVisualComboState(gift) {
		playGif(gift);
		gift.timer++;
		if( !gift.lock && gift.timer > combo.FPS * combo.SHAPE_DURATION ) {
			animateComboOut(gift);
		}
	}

	/**
	 * 检查缓存道具状态
	 **/
	function checkCacheComboState(gift) {
		gift.timer++;
		if( gift.timer > combo.FPS * combo.SHAPE_DURATION ) {
			delete combo.poolCache[gift.$id];
			combo.countCache--;
		}
	}

	/**
	 * 道具渐入
	 **/
	function animateComboIn(gift) {
		createjs.Tween.get(gift.getChildByName('cloud'))
			.to({scaleX: 1.2, scaleY: 1.2, alpha: 1}, 150)
			.to({scaleX: .95, scaleY: .95}, 150)
			.to({scaleX: 1, scaleY: 1}, 150);
		createjs.Tween.get(gift.getChildByName('sender'))
			.to({scaleX: 1.2, scaleY: 1.2, alpha: 1}, 150)
			.to({scaleX: .95, scaleY: .95}, 150)
			.to({scaleX: 1, scaleY: 1}, 150);
		createjs.Tween.get(gift.getChildByName('gif'))
			.to({scaleX: 1.1, scaleY: 1.1, alpha: 1}, 150)
			.to({scaleX: 1, scaleY: 1}, 150);
		createjs.Tween.get(gift.getChildByName('mask'))
			.to({scaleX: 1.1, scaleY: 1.1, alpha: 1}, 150)
			.to({scaleX: .95, scaleY: .95}, 150)
			.to({scaleX: 1, scaleY: 1}, 150);
		createjs.Tween.get(gift.getChildByName('cross'))
			.wait(250)
			.to({scaleX: 1.2, scaleY: 1.2, alpha: 1}, 150)
			.to({scaleX: .95, scaleY: .95}, 150)
			.to({scaleX: 1, scaleY: 1}, 150);
		for( var i = 0, len = 2; i < len; i++ )
			createjs.Tween.get(gift.getChildByName('text' + i))
				.wait(500)
				.to({scaleX: 1.1, scaleY: 1.1, alpha: 1}, 150)
				.to({scaleX: .95, scaleY: .95}, 150)
				.to({scaleX: 1, scaleY: 1}, 150);	
	}

	/**
	 * 道具渐出
	 **/
	function animateComboOut(gift) {
		gift.lock = 1;
		createjs.Tween.get(gift.container)
			.to({x: -40, alpha: 0}, 200)
			.wait(100)
			.call(function(){
				stage.removeChild( combo.poolIn[gift.$id].container );
				gift.timer = 0;
				gift.lock = 0;
				delete combo.poolIn[gift.$id];
				combo.ListIn.shift();
				combo.countIn--;
				combo.poolCache[gift.$id] = gift;
				combo.countCache++;
				if(combo.countIn) resetComboPosition();
			});
	}

	/**
	 * 队列道具加入动画列表尾部
	 **/
	function insertVisualCombo() {
		if( !combo.poolQueue.length ) return 0;
		var data = combo.poolQueue.shift();
		if( combo.poolIn.hasOwnProperty(data.$id) ) {
			updateVisualCombo(data);
		}
		else {
			data.pos = combo.HEIGHT*combo.countIn;
			comboConstructor(data);		
		}
		combo.countQueue--;
	}

	/**
	 * 更新可视道具
	 **/	
	function updateVisualCombo(data) {
		var gift = combo.poolIn[data.$id].container;
		gift.getChildByName('text0').text = data.super;
		createjs.Tween.get(gift.getChildByName('text0'), {override:true})
			.to({scaleX: 1.8, scaleY: 1.8, alpha: 1}, 120)
			.to({scaleX: .8, scaleY: .8}, 120)
			.to({scaleX: 1, scaleY: 1}, 120);
		combo.poolIn[data.$id].timer = 0;
	}

	/**
	 * 重置道具位置
	 **/	
	function resetComboPosition() {
	 	var i = 0, that = {};
	 	for( var obj in combo.poolIn ) {
	 		that = combo.poolIn[obj];
	 		combo.resetPositionLock++;
	 		createjs.Tween.get(that.container)
				.to({y: combo.HEIGHT*i }, 100)
				.call(function(){
	 				combo.resetPositionLock--;
	 				// 检查队列道具状态
	 			});
	 		i++;
	 	}
	 	if( combo.countQueue ) insertVisualCombo();
	}

	/**
	 * 播放Gif动画
	 **/
	function playGif(gift) {
		var k = gift.gifSequence.k,
			f = gift.gifSequence.f,
			t = gift.gifSequence.t;
		t++;
		if( t >= (k+1)*combo.GIFSPEED ) k++;
		if( k >= (f+1) ) k = t = 0;
		gift.container.getChildByName('gif').sourceRect = new createjs.Rectangle( k*60, 0, 60, 60);
		gift.gifSequence.k = k;
		gift.gifSequence.f = f;
		gift.gifSequence.t = t;		
	}

	/**
	 * 重置当前视图
	 **/
	function resetAllCombo(err) {
		combo.poolIn = {};
		combo.poolCache = {};
		combo.poolQueue = [];
		combo.ListIn = [];
		combo.countIn = 0;
		combo.countCache = 0;
		combo.countQueue = 0;
		combo.resetPositionLock = 0;
		combo.insertTimer = combo.INSERTTIMELIMIT;
		stage.removeAllChildren();
		stage.clear();
		console.log('CANVAS MSG:' + err + '; RESET DONE;');
	}

	/**
	 * Time Trace Graph ( only for test )
	 * For animation
	 * default trace area size: 300 * 300
	 **/

	// var traceStage = new createjs.Stage('timeTrace'),
 	// 		traceAreaSize = 300;

	// function timeTrace(x,y) {
	// 	var g = new createjs.Graphics();
	// 	g.beginFill('#000').drawCircle(0,0,1);
	// 	var s = new createjs.Shape(g);
	// 	s.x = x * traceAreaSize;
	// 	s.y = (1-y) * traceAreaSize;
	// 	traceStage.addChild(s);
	// 	traceStage.update();
	// }

});
