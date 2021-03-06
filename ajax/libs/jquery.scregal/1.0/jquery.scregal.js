/**
 * Copyright (c) Bartłomiej Semańczyk - bartekss2@gmail.com http://www.blue-world.pl
 * @version 1.0
 * Last Update: Friday, 2 January 2015
*/

(function($) {
	'use strict';
	var Scregal = (function() {

		/* boxes */
		var $instance = undefined;
		var $scregalBox = $('<div class="scregalBox">');
		var $scregalLeftBox = $('<a href="#" class="scregalWrap scregalLeftBox scregalBesideBox">');
		var $scregalCenterBox = $('<div class="scregalWrap scregalCenterBox">');
		var $scregalRightBox = $('<a href="#" class="scregalWrap scregalRightBox scregalBesideBox">');

		var $scregalLeftImg = $('<img class="scregalLeftImg" />').css('display', 'none');
		var $scregalCenterImg = $('<img class="scregalCenterImg" />').css('display', 'none');
		var $scregalRightImg = $('<img class="scregalRightImg" />').css('display', 'none');

		var $scregalRightNav = $('<div class="scregalNavigation scregalRightNavigation">');
		var $scregalLeftNav = $('<div class="scregalNavigation scregalLeftNavigation">');
		var $scregalClose = $('<div class="scregalClose">');
		var $scregalFront = $('<div class="scregalFront"><div class="scregalTitle"></div></div>').css('display', 'none');

		//flags
		var isInitialized = false;
		var isScregalWorking = false;
		var isAutoGalleryRunning = false;
		var isNavigationHidden = false;
		var isFrontHidden = false;

		/* timer handlers */
		var auto_gallery_delay_timer = null;
		var auto_gallery_init_timer = null;
		var ids_counter = 0;
		var handlerForElem = undefined;

		/* datas */
		var scregal_datas = {};
		var recent_scregal_data = undefined;
		var recent_data_image = {
			scregalCenterImg : {},
			scregalLeftImg : {},
			scregalRightImg : {} };

		/* options */
		var defaults = {
			elems: '> a',
			maxWidth: '95%',
			centerDisappearAnimation: { opacity: 0 },
			sideDisappearAnimation: { opacity: 0 },
			centerAppearAnimation: { opacity: 1 },
			sideAppearAnimation: { opacity: 1 },
			disappearDuration: 2000,
			appearDuration: 2000,
			disappearEasing: 'easeInOutExpo',
			appearEasing: 'easeInOutExpo',
			isNavigationHidden: false,
			isNavigationKeyboard: true,
			hideNavigationWhenAutoGallery: true,
			hideFrontWhenAutoGallery: false,
			runAutoGalleryAfterDelay: 5000,
			autoGalleryDelay: 3000,
			prev: undefined,
			next: undefined,
			close: undefined,
			addFront: true, //whether display scregal front
			frontContent: function() {}, //if addFront, without content, return jquery object to prepend scregalFront
			frontTitle: function() { return $('<div class="scregalSubtitle">'); }, //called on every jquery element  from elems objects to, to html it withis title within scregalFront, callend wiith context of elem
			basicHeight: function() { return $(window).height(); },
			basicWidth: function() { return $(window).width(); },
			getGalleryName: function() { return 'rel'; } //order with galleries, first check if elem has data-rel attribute. If there is no attribute, then the function is called with context of elem.
			//+ json from options
		};

		var Scregal_Class = function(gallery, opts) {
			var that = this;
			this.updateOptions(opts);
			this.create_scregal_box();

			$instance = gallery;
			if (typeof gallery === 'string') {
				$instance = $(gallery);
			}

			if ($instance.length) {
				$instance.find(defaults.elems).each(function() {
					that.append($(this));
				});
				return this;
			} else {
				// throw 'There is no instance of Scregal for';
			}
		};

		Scregal_Class.prototype.updateOptions = function(opts) {
			opts ? $.extend(defaults, opts) : '';
		};

		Scregal_Class.prototype.create_navigation = function() {
			var that = this;

			!defaults.prev ? $scregalBox.append($scregalLeftNav) : '';
			!defaults.next ? $scregalBox.append($scregalRightNav) : '';
			!defaults.close ? $scregalBox.append($scregalClose) : '';

			defaults.isNavigationHidden ? that.disappearNavigation() : '';
		};

		Scregal_Class.prototype.create_scregal_box = function() {
			if (!isInitialized) {
				$('body').prepend($scregalBox);
				$scregalBox.append($scregalLeftBox, $scregalCenterBox, $scregalRightBox, $scregalLeftImg, $scregalCenterImg, $scregalRightImg);

				if (defaults.addFront) {
					$scregalCenterBox.append($scregalFront);
					$scregalFront.prepend(defaults.frontContent());
				 	$scregalFront.show(0);
				}

				this.create_navigation();
				this.set_other_handlers();
				isInitialized = true;
			}
		};

		Scregal_Class.prototype.append = function(elems) {
			var that = this;
			elems.each(function(){
				var t = $(this);
				var rel = t.attr('data-rel') ? t.attr('data-rel') : defaults.getGalleryName.call(t);

				!scregal_datas[rel] ? scregal_datas[rel] = [] : '';
				var data = {
					elem: t,
					href: t.attr('href'),
					rel: rel,
					id: ids_counter++,
					frontTitle : defaults.frontTitle.call(t)
				};

				scregal_datas[rel].push(data);

				t.addClass('scregal');
				that.set_handler(t);
				t.data('scregal', data);
				$instance.trigger('elemAppended', [t]);
			});
		};

		Scregal_Class.prototype.remove = function(elems) {
			var that = this;
			elems.each(function(){
				var data = $(this).data('scregal');
				var gallery = scregal_datas[data.rel];
				for (var i in gallery) {
					var index = parseInt(i);
					if (gallery[index].id == data.id) {
						gallery.splice(index, 1);
					}
				}
				$(this).removeData('scregal');
				$instance.trigger('elemRemoved', [$(this)]);
			});
		};

		Scregal_Class.prototype.set_recent_scregal_data = function(data) {
			recent_scregal_data = data;
		};

		Scregal_Class.prototype.disappearNavigation = function() {
			isNavigationHidden = true;
			$scregalRightNav.add($scregalLeftNav).add($scregalClose).add(defaults.prev + ', ' + defaults.next + ', ' + defaults.close).fadeOut(300);
		};

		Scregal_Class.prototype.appearNavigation = function() {
			if (!defaults.isNavigationHidden) {
				isNavigationHidden = false;
				$scregalRightNav.add($scregalLeftNav).add($scregalClose).add(defaults.prev + ', ' + defaults.next + ', ' + defaults.close).fadeIn(300);
			}
		};

		Scregal_Class.prototype.disappearFront = function() {
			isFrontHidden = true;
			$scregalFront.fadeOut(300);
		};

		Scregal_Class.prototype.appearFront = function() {
			isFrontHidden = false;
			$scregalFront.fadeIn(300);
		};

		Scregal_Class.prototype.is_navigation_hover = function() {
			var prev = defaults.prev ? defaults.prev + ':hover' : '.scregalLeftNavigation:hover';
			var next = defaults.next ? defaults.next + ':hover' : '.scregalRightNavigation:hover';
			var elems = $(prev + ', ' + next);
			var isHover = elems.length ? true : false;

			return isHover;
		};

		Scregal_Class.prototype.autoGalleryInit = function() {
			var that = this;
			clearTimeout(auto_gallery_init_timer);
			if (defaults.runAutoGalleryAfterDelay) {
				auto_gallery_init_timer = setTimeout(function(){
					isScregalWorking && !that.is_navigation_hover() ? that.autoGalleryStart() : '';
				}, defaults.runAutoGalleryAfterDelay);
			}
		};

		Scregal_Class.prototype.autoGalleryStart = function() {
			var that = this;
			isAutoGalleryRunning = true;

			defaults.hideNavigationWhenAutoGallery ? that.disappearNavigation() : '';
			defaults.hideFrontWhenAutoGallery ? that.disappearFront() : '';
			auto_gallery_delay_timer = setInterval(function(e){
				that.gallery_progress(true);
			}, defaults.autoGalleryDelay + Math.max(defaults.disappearDuration, defaults.appearDuration));
		};

		Scregal_Class.prototype.autoGalleryStop = function() {
			var that = this;
			isAutoGalleryRunning = false;

			clearInterval(auto_gallery_delay_timer);

			that.autoGalleryInit();
		};

		Scregal_Class.prototype.set_other_handlers = function() {
			var that = this;
			var i = 3;
			$scregalBox.on('mousemove', function(e){
				isFrontHidden ? that.appearFront() : '';
				isNavigationHidden && !defaults.isNavigationHidden ? that.appearNavigation() : '';
				isAutoGalleryRunning ? that.autoGalleryStop() : '';

				that.autoGalleryInit();
			});

			$('.scregalCenterImg, .scregalLeftImg, .scregalRightImg').load(function(){
				recent_data_image[$(this).attr('class')]['width'] = $(this).width();
				recent_data_image[$(this).attr('class')]['height'] = $(this).height();
				recent_data_image[$(this).attr('class')]['href'] = $(this).attr('src');

				if (--i == 0) {
					that.update_boxes_content();
					that.update_boxes_size();
					i = 3;
				}
			});

			$(window).resize(function(){
				that.update_boxes_size();
			});

			$('body').on('click', '.scregalRightBox', function(e){
				e.preventDefault();
				that.autoGalleryStop();
				that.gallery_progress(true);
			});

			$('body').on('click', '.scregalLeftBox', function(e){
				e.preventDefault();
				that.autoGalleryStop();
				that.gallery_progress();
			});

			$('body').on('click', defaults.prev + ', .scregalLeftNavigation', function(e){
				e.preventDefault();
				e.stopPropagation();
				that.gallery_progress();
			});

			$('body').on('click', defaults.next + ', .scregalRightNavigation', function(e){
				e.preventDefault();
				e.stopPropagation();
				that.gallery_progress(true);
			});

			$('body').on('click', defaults.close + ', .scregalClose', function(e){
				e.preventDefault();
				e.stopPropagation();
				that.closeGallery();
			});

			$(document).on('keyup', function(e){
				e.preventDefault();
				var which = e.which;
				if (isScregalWorking && defaults.isNavigationKeyboard) {
					switch (which) {
						case 27 : that.closeGallery(); break;
						case 37 : that.gallery_progress(); that.autoGalleryStop(); break;
						case 39 : that.gallery_progress(true); that.autoGalleryStop(); break;
					}
				}
			});
		};

		Scregal_Class.prototype.openGallery = function(elem) {
			var that = this;
			var data = elem.data('scregal');
			that.set_recent_scregal_data(data);
			that.load_gallery_data();
			isScregalWorking = true;
			$('.scregalBox').fadeIn(300);
			$instance.trigger('scregalAppeared');
		};

		Scregal_Class.prototype.set_handler = function(elem) {
			var that = this;
			handlerForElem = function(e){
				e.preventDefault();
				that.openGallery(elem);
			};
			elem.on('click', handlerForElem);
		};

		Scregal_Class.prototype.gallery_progress = function(isNext) {
			var id = isNext ? this.getNextIndex() : this.getPrevIndex();
			var data = scregal_datas[recent_scregal_data.rel][id];
			this.set_recent_scregal_data(data);
			this.load_gallery_data();
		};

		Scregal_Class.prototype.closeGallery = function() {
			$('.scregalBox').fadeOut(300);
			$('.scregalFigure').remove();
			isScregalWorking = false;
			this.autoGalleryStop();
			$instance.trigger('scregalDisappeared');
		};

		Scregal_Class.prototype.getPrevIndex = function() {
			var id = recent_scregal_data.id;
			var gallery = scregal_datas[recent_scregal_data.rel];
			var length = gallery.length;

			for (var i in gallery) {
				var index = parseInt(i);
				if (gallery[index].id == id) {
					return index == 0 ? length-1 : index-1;
				}
			}
		};

		Scregal_Class.prototype.getNextIndex = function() {
			var id = recent_scregal_data.id;
			var gallery = scregal_datas[recent_scregal_data.rel];
			var length = gallery.length;

			for (var i in gallery) {
				var index = parseInt(i);
				if (gallery[index].id == id) {
					return index == length-1 ? 0 : index+1;
				}
			}
		};

		Scregal_Class.prototype.add_front_to_item = function() {
			$('.scregalTitle').html(recent_scregal_data.frontTitle);
		};

		Scregal_Class.prototype.load_gallery_data = function() {
			var id_prev = this.getPrevIndex();
			var id_next = this.getNextIndex();

			$scregalCenterImg.attr('src', recent_scregal_data.href);
			$scregalLeftImg.attr('src', scregal_datas[recent_scregal_data.rel][id_prev].href);
			$scregalRightImg.attr('src', scregal_datas[recent_scregal_data.rel][id_next].href);

			defaults.addFront ? this.add_front_to_item() : '';
		};

		Scregal_Class.prototype.on = function(eventName, eventHandler) {
			$instance.on(eventName, eventHandler);
		};

		Scregal_Class.prototype.off = function(eventName, eventHandler) {
			$instance.off(eventName, eventHandler);
		};

		Scregal_Class.prototype.update_boxes_size = function() {
			var basicWidth = defaults.basicWidth();
			var basicHeight = defaults.basicHeight();
			var scregalCenterImgWidth = recent_data_image.scregalCenterImg.width;
			var scregalCenterImgHeight = recent_data_image.scregalCenterImg.height;
			var scregalCenterImgNewWidth = Math.floor(scregalCenterImgWidth/(scregalCenterImgHeight/basicHeight));


			$scregalCenterBox.add($scregalLeftBox).add($scregalRightBox).height(basicHeight);

			var scregalCenterBoxNewWidth = typeof defaults.maxWidth == 'string' ? parseInt(defaults.maxWidth)/100 * basicWidth >= scregalCenterImgNewWidth ? scregalCenterImgNewWidth : parseInt(defaults.maxWidth)/100 * basicWidth : defaults.maxWidth >= scregalCenterImgNewWidth ? scregalCenterImgNewWidth : defaults.maxWidth;

			scregalCenterBoxNewWidth = Math.floor(scregalCenterBoxNewWidth);
			$scregalCenterBox.css({ width: scregalCenterBoxNewWidth });
			$scregalLeftBox.css({ width: (basicWidth - scregalCenterBoxNewWidth)/2 });
			$scregalRightBox.css({ width: (basicWidth - scregalCenterBoxNewWidth)/2 });
		};

		Scregal_Class.prototype.update_boxes_content = function() {

			var $figure = $('<figure class="scregalFigure scregalAdding">');
			var $scregalFigureCenter = $figure.clone().css('background-image', 'url(' + recent_data_image.scregalCenterImg.href + ')');
			var $scregalFigureLeft = $figure.clone().css('background-image', 'url(' + recent_data_image.scregalLeftImg.href + ')');
			var $scregalFigureRight = $figure.clone().css('background-image', 'url(' + recent_data_image.scregalRightImg.href + ')');

			$('.scregalWrap .scregalAdding').remove();
			$scregalCenterBox.prepend($scregalFigureCenter);
			$scregalLeftBox.prepend($scregalFigureLeft);
			$scregalRightBox.prepend($scregalFigureRight);

			$('.scregalBesideBox .scregalAdded').animate(defaults.sideDisappearAnimation, defaults.disappearDuration, defaults.disappearEasing, function(){
				$(this).remove();
			});

			$('.scregalCenterBox .scregalAdded').animate(defaults.centerDisappearAnimation, defaults.disappearDuration, defaults.disappearEasing, function(){
				$(this).remove();
			});

			$('.scregalBesideBox .scregalAdding').animate(defaults.sideAppearAnimation, defaults.appearDuration, defaults.appearEasing, function(){
				$(this).removeClass('scregalAdding');
				$(this).addClass('scregalAdded');
			});

			$('.scregalCenterBox .scregalAdding').animate(defaults.centerAppearAnimation, defaults.appearDuration, defaults.appearEasing, function(){
				$(this).removeClass('scregalAdding');
				$(this).addClass('scregalAdded');
			});
		};

		return Scregal_Class;
	})();

	window.Scregal = Scregal;

	var auto_scregal_instances = $('.js-scregal');
	auto_scregal_instances.each(function(){
		var gallery = $(this);
		var scregal = new Scregal(gallery);
		$(this).data('scregal', scregal);
	});


	$.fn.scregal = function(opts) {
		$(this).each(function(){
			var gallery = $(this);
			var scregal = new Scregal(gallery, opts);
			$(this).addClass('js-scregal');
			$(this).data('scregal', scregal);
		});
	};

}(jQuery));