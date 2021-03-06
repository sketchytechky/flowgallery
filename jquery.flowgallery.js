/*!
 * jQuery flowgallery plugin: Cover Flow Image Gallery
 * Examples and documentation at: http://flowgallery.org
 * Version: 0.7.0pre (12-NOV-2012)
 * Author: Boris Searles (boris@lucidgardens.com)
 * Requires jQuery v1.4 or later
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */
;(function( $, window, document, undefined ){
  "use strict";

  /**
   * helper function to get current plugin version
   * @return {string}
   */
  var getVersion = function () {
    return "0.7.0pre-multi";
  };

  var FlowGallery = function(list, config) {

    var self = this,
      list,
      $list,                  // reference to list as jquery object
      options = {},           // merged config options with defaults
      centerX = 0,            // horizontal center within list
      centerY = 0,            // vertical center within list
      $container = false,     // parent element of list
      $caption = false,       // caption element
      activeItem = false,     // reference to active FlowItem
      activeIndex = 0,
      activeRow = 0,
      //rowlength = 1,          // default one row
      listWidth = 0,          // list width (default: screen width)
      rowHeight = 0,          // row height (height of highest image)
      listHeight = 0,         // list height
      //flowItems = [],         // array of FlowItems
      flowRows = [],          // row of flows (used with options.multirow)
      elCounter = 0,          // number of list items
      resizeWhileDisabled = false;

    // initialize gallery
    function init() {
      var metadata;

      $list = $(list);

      // This next line takes advantage of HTML5 data attributes
      // to support customization of the plugin on a per-element
      // basis. For example,
      // <ul id='gallery' data-plugin-options='{"activeIndex": 3}'>...</ul>
      metadata = $list.data( 'plugin-options' );

      options = $.extend({}, FlowGallery.defaults, config, metadata);
      $container = $list.parent();

      if (!options.multirow) {
          self.length = $list.children().length;
          self.rowlength = 1;
      } else {
          // find the count of .item
          // <ul id=gallery> <li> <ul> <li class=item> <img...>
          self.rowlength = $list.children().length;
          self.length = $list.find("ul:first").children().length;
      }
      self.options = options;

      initDom();
      initFlowItems();

      $list.css('visibility', 'visible');

      $(window).resize( $.proxy(windowResizeHandler, self) );

      if(options.enableKeyNavigation===true) {
        $(document).keydown(handleKeyEvents);
      }

      updateFlow(false);
    };


    // initialize dom setup and styling
    function initDom() {
      // set required styling on list element
      $list.css($.extend({
        listStyle: 'none',
        overflow: 'hidden',
        marginLeft: '0',
        paddingLeft: '0',
        position: 'relative',
        width: '100%'
      }, options.containerCSS));

      // if listHeight is defined in css, use it
      if (options.containerCSS.height) {
          listHeight = options.containerCSS.height;
      }

      initCaption();
      initWrapper();
    };


    // initialize caption - a single instance is shared by all images
    // TODO: share caption
    function initCaption() {
      var captionElem = document.createElement('p');
      $caption = $(captionElem).addClass('fg-caption').css({
        backgroundColor: options.backgroundColor,
        display: 'none',
        marginTop: '0',
        padding: '8px ' + (options.imagePadding+10) + 'px 15px',
        position: 'absolute'
      });
    };


    // initialize wrapper around gallery - used for positioning caption
    function initWrapper() {
      var wrapperElem = document.createElement('div');
      $(wrapperElem)
      .addClass('fg-wrapper').css({
        position: 'relative'
      })
      .append( $list.get(0) )
      .append( $caption.get(0) );
      $container.append(wrapperElem);
    };


    function initFlowItems() {
      self.enabled = false;
      var flowItems = [];

      var initItem = function(index,item) {
        var flowItem = new FlowItem(item, index, options);
        if(!flowItem.$el) { return; }

        flowItem.$el.on('loaded', onItemLoaded);
        flowItem.$el.on('click', onItemClicked);

        if(!activeItem) {
          if (!options.multirow && options.activeIndex===index) {
            flowItem.$el.addClass('active');
            activeItem = flowItem;
            activeIndex = index;
          }
          else if (options.multirow && options.activeIndex===index.index && options.activeRow===index.row) {
            flowItem.$el.addClass('active');
            activeItem = flowItem;
            activeIndex = index.index;
            activeRow = index.row;
          }
        }

        flowItems.push(flowItem);
      };
      
      // loop through list items to extract image data and determine list height
      if (!options.multirow) {
        $list.children().each(initItem);
        flowRows.push(flowItems);
      } else {
        $list.children().each(function (row,nested) {
            flowItems = [];  // reset for the row
            $(nested).find('ul').children().each(function (i,e) { initItem({ 'index': i, 'row' : row },e); });
            flowRows.push(flowItems);
        });
      }

      if (!activeItem) {
        throw "No active item picked!";
      }

      self.enabled = true;
      listWidth = $container.width();
      centerX = listWidth*0.5;
    };


    function onItemLoaded() {
      var item = $(this).data('flowItem');
      updateListHeight(item.h + (options.thumbHeight * self.rowlength));
      if(item.index===options.activeIndex && item.row===options.activeRow) {
        self.activeLoaded = true;
        updateFlow(true);
      } else if(self.activeLoaded && (item.th !== options.loadingHeight || item.tw !== options.loadingWidth)) {
        updateFlow(true);
      }
    };


    function onItemClicked(e) {
      var item = $(this).data('flowItem');
      if(item !== activeItem) {
        if (self.activeRow !== item.row) {
          self.activeRow = item.row;
        }
        var oldIndex = activeIndex;
        flowInDir(item.index-oldIndex);
      } else if(options.forwardOnActiveClick===true) {
        flowInDir(1);
      }
    };


    // only applied after animation of 'active' element
    function afterFlowHandler(){
      showCaption();

      // adjust if width changed (i.e. if scrollbars get displayed)
      if($container.width() !== listWidth) {
        listWidth = $container.width();
        centerX = listWidth*0.5;
        updateFlow();
        showCaption();
      }
    };


    // special afterFlow handler for previously active item
    function getOldActiveAfterFlowHandler(itemIndex,rowIndex) {
      return function() {
        var item = flowRows[rowIndex][itemIndex];
        item.oldActive = false;
      };
    };


    function updateFlow(animate) {
      if(!self.isEnabled()) { return false; }

      var config = {},
        isBefore = true,   // in loop, are we before 'active' item
        completeFn = null, // callback method to call after animation (for 'active' item)
        currentItem = false,
        $listItem = false,
        i,j;

      for(j=0; j<flowRows.length; j++) {
        var flowItems = flowRows[j];

        // update centerY based on active image
        centerY = options.thumbTopOffset==='auto' ? activeItem.h*0.5 : options.thumbTopOffset;
        //XXX self.th was not defined here
        centerY += (self.th || 100) * j; //j*flowItems[0].h;

        var itemsLength = flowItems.length;
        for(i=0; i<itemsLength; i++) {
          currentItem = flowItems[i];
          $listItem = currentItem.$el;

          isBefore = (i<=activeIndex);

          if( $listItem.hasClass('active') ) {
            config = {
              left: (centerX - options.imagePadding - currentItem.w * 0.5) + 'px', top: '0',
              width: currentItem.w+'px',
              height: currentItem.h+'px',
              padding: options.imagePadding+'px',
              'z-index': 100   // ensure active item is top
            };
            completeFn = afterFlowHandler;

            // animate list size if active image height has changed
            if(listHeight !== currentItem.h) {
              listHeight = currentItem.h;
              listHeight += options.imagePadding*2;
              if(animate) {
                $list.stop().animate({
                  height: listHeight
                }, {
                  duration: options.duration,
                  easing: options.easing
                });
              } else {
                // only change list height if it is smaller
                if (listHeight < currentItem.h) { 
                  $list.height(listHeight);
                }
              }
            }
          } else {
            config = calculateOffset(currentItem,i,j,isBefore,centerX,centerY);
            config['z-index'] = 0;

            completeFn = null;

            // TODO: rethink oldActive check, need to set width/height on first render
            // only animate width/height for old active item
            // if(currentItem.oldActive) {
            config.width = currentItem.tw+'px';
            config.height = currentItem.th+'px';
            config.padding = options.thumbPadding+'px';
            completeFn = getOldActiveAfterFlowHandler(i,j);
            // }
          }

          var noAnimateCSS = ['z-index', '-webkit-transform', '-moz-transform', '-ms-transform', 'transform'];
          var baseCSS = {};
          $.each(noAnimateCSS, function (i,css) {
            baseCSS[css]=config[css]||'';
          });
          $listItem.css(baseCSS);

          if(animate) {
            $listItem.stop().animate(config, { duration: options.duration, easing: options.easing, complete: completeFn });
          } else {
            $listItem.css(config);
            if(completeFn) { completeFn(); }
          }
        }
      }
    };


    // trigger flow in direction from current active element;
    // positive value flows to the right, negative values to the left;
    function flowInDir(dir, animate) {
      if(!self.isEnabled()) { return false; }

      var newIndex = activeIndex + dir;
      animate = animate!==undefined ? animate : options.animate;

      if(newIndex > self.length-1 || newIndex < 0) {
        return false;
      }

      activeItem.oldActive = true; // mark old active item
      if(dir<0 && activeIndex > 0) {
        activeItem.oldActive = true;
        activeIndex += dir;
      } else if(dir>0 && activeIndex < self.length-1) {
        activeIndex += dir;
      } else {
        return false;
      }
      activeItem = flowRows[activeRow][activeIndex];
      prepareFlow();
      updateFlow(animate);
    };

    function flowChangeRow (dir, animate) {
      activeRow = (activeRow+self.rowlength+dir) % self.rowlength;
      activeItem = flowRows[activeRow][activeIndex];
      prepareFlow();
      updateFlow(animate);
    };


    function prepareFlow() {
      //if (_options.circular) {
      //  _circularFlow(currentIndex);
      //}

      $caption.hide();
      $list.find('.active').removeClass('active');
      $(activeItem.$el).addClass('active');

      // update width (changes if scrollbars disappear)
      listWidth = $container.width();
      centerX = listWidth*0.5;
    };

    function calculateOffset(item,index,row,isBefore,centerX,centerY) {
        var centerY = options.thumbTopOffset==='auto' ? activeItem.h*0.5 : options.thumbTopOffset;
        //XXX self.th was not defined here
        centerY += (self.th || 100) * row; //j*flowItems[0].h;
      
        var config = {
          left: calculateLeftPosition(index, isBefore),
          top: (centerY - item.th*0.5) + 'px',
        };

        if (options.arcradius) {
          //XXX: currently just approximate
          // we "bend the x,y from center X, centerY"
          /* // parametric...
          x = cx + r * cos(a)
          y = cy + r * sin(a)
          */
          var radiusAdjusted = options.arcradius - (100 * row);
          var cy = centerY+radiusAdjusted;
          var angle = options.arcanglestep*(index - activeIndex) + (3*Math.PI / 2);
          var baseXOffset = isBefore ? -200 : 200;
          config = {
            left: centerX + radiusAdjusted * Math.cos(angle) + baseXOffset,
            top : cy + radiusAdjusted * Math.sin(angle)
          };
          if (options.arcrotate) {
            // need to reverse the extra 3pi/2 rotation
            var rotateStr = 'rotate('+Math.round((angle-(3*Math.PI / 2))*100)/100+'rad)';
            $.extend(config, {
              '-webkit-transform': rotateStr,
              '-moz-transform': rotateStr,
              '-ms-transform': rotateStr,
              'transform': rotateStr
            });
          }
        }
        return config;
    };

    function calculateLeftPosition(current, isBefore) {
      var left = centerX,
        i = 0;

      if (isBefore) {
        left -= flowRows[activeRow][activeIndex].w*0.5;
        left -= options.imagePadding;
        left -= (activeIndex - current) * 10;
        left -= (activeIndex - current) * 2 * options.thumbPadding;
        for (i = current; i < activeIndex; i++) {
          left -= flowRows[activeRow][i].tw;
        }
      } else {
        left += flowRows[activeRow][activeIndex].w*0.5;
        left += options.imagePadding;
        left += (current - activeIndex) * 10;
        left += (current - activeIndex) * 2 * options.thumbPadding;
        for (i = activeIndex + 1; i < current; i++) {
          left += flowRows[activeRow][i].tw;
        }
      }
      return left + 'px';
    };


    // window resize handler - update gallery when window is resized
    function windowResizeHandler() {
      if(!self.isEnabled()) { resizeWhileDisabled = true; return false; }
      listWidth = $container.width();
      centerX = listWidth*0.5;
      updateFlow();
      showCaption();
    };


    // show caption under active image
    function showCaption() {
      if(!activeItem.isLoaded) { return false; }

      var fullHeight,
        captionText = activeItem.captionText;

      if(captionText && captionText.length > 0){
        $caption.text(captionText);

        $caption.css({
          left: centerX - options.imagePadding - activeItem.w * 0.5,
          top: activeItem.h + options.imagePadding*2,
          width: activeItem.w - 20
        });

        // set height of caption as bottom margin for list
        fullHeight = activeItem.h + $caption.height() + 40;
        //this.$list.height(fullHeight);

        $caption.fadeIn('fast');
      } else {
        // TODO: what happens here?
        fullHeight = activeItem.h + 40;
        //this.$list.height(fullHeight);
      }
    };


    // set list height to height of tallest image (needed for overflow:hidden)
    function updateListHeight(height) {
      if(height > listHeight) {
        listHeight = height;
        listHeight += options.imagePadding*2*self.rowlength;
        $list.height(listHeight);
      }
    };


    // handle key events
    function handleKeyEvents(e) {
      if(e.keyCode==38) { // up arrow key
        flowChangeRow(1);
      } else if (e.keyCode==40) { // down arrow key
        flowChangeRow(-1);
      } else if(e.keyCode===37) { // right arrow key
        flowInDir(-1);
      } else if(e.keyCode===39) { // left arrow key
        flowInDir(1);
      }
    };

    // Public API ==================================================

    this.length = 0;             // number of images in gallery
    this.enabled = true;         // is gallery currently enabled
    this.options = {};

    this.getActiveIndex = function() {
      return activeIndex;
    };

    this.next = function(animate) {
      flowInDir(1, animate);
      return this;
    };

    this.prev = function(animate) {
      flowInDir(-1, animate);
      return this;
    };

    this.jump = function(index, animate) {
      flowInDir(index - activeIndex, animate);
      return this;
    };

    this.isEnabled = function() {
      return this.enabled===true;
    };

    this.disable = function() {
      this.enabled = false;
      return this;
    };

    this.enable = function() {
      this.enabled = true;

      // if resize event was fired while disabled, then adjust after
      // being enabled again
      if(resizeWhileDisabled) {
        $.proxy(this.windowResizeHandler, this)();
        resizeWhileDisabled = false;
      }
      return this;
    };

    // initialize
    init();
  };

  // default option values
  FlowGallery.defaults = {
    activeIndex: 0,          // index of image that is initially active
    activeRow: 0,            // index of default active Row
    animate: true,
    arcradius: false,
    arcrotate: false,   // can if we rotate image based on arc
    arcanglestep : false, // in radian for each step
    backgroundColor: 'black',
    circular: false,
    duration: 900,            // animation duration (higher value = slower speed)
    easing: 'linear',
    enableKeyNavigation: true,   // enables forward/backward arrow keys for next/previous navigation
    forceHeight: false,
    forceWidth: false,
    forwardOnActiveClick: true, // should clicking on active image, show next image?
    imagePadding: 0,         // border of active image
    loadingClass: "loading", // css class applied to <li> elements of loading images
    loadingHeight: 60,       // loading height to use if cannot be determined
    loadingWidth: 100,       // loading width to use if cannot be determined
    multirow: false,        // show multiple row of galleries
    thumbHeight: 'auto',
    thumbPadding: 0,         // border of thumbnails
    thumbTopOffset: 'auto',  // top offset in pixels or 'auto' for centering images within list height
    thumbWidth: 'auto',
    containerCSS : {}   // extra css option for container (e.g. control height)
  };



  var FlowItem = function(elem, index, options) {
    var self = this,
      $img = false;

    this.$el = $(elem);
    this.row = 0;
    if (typeof(index) === 'object') {
        this.index = index.index;
        this.row = index.row;  // row number of the element
    } else {
        this.index = index;
    }

    this.h = 0;               // image height
    this.th = 0;              // thumb height
    this.w = 0;               // image width
    this.tw = 0;              // thumb width
    this.active = false;      // is active image?

    this.isLoaded = false;    // is image fully loaded?
    this.captionText = false; // text specified within 'title' attribute of img
    this.oldActive = false;   // is this image being animated away from active position?

    function init() {
      self.h = options.loadingHeight;
      self.th = options.loadingHeight;
      self.w = options.loadingWidth;
      self.tw = options.loadingWidth;

      $img = self.$el.find('img');

      if($img.length===0) {
        // mark as invalid if no image found
        self.$el = false;
        return;
      }

      self.$el.data('flowItem', self);
      self.captionText = $img.attr('title');

      if(options.forceWidth) {
        $img.width(options.forceWidth);
      }

      // remove image and add 'loading' class
      $img.hide().parent().addClass(options.loadingClass).css({
        height: self.th,
        width: self.tw
      });

      addLoadHandler();

      self.$el.css({
        backgroundColor: options.backgroundColor,
        padding: options.thumbPadding,
        position: 'absolute',
        textAlign: 'center'
      });

      $img.css({
        cursor: 'pointer',
        height: '100%',
        imageRendering: 'optimizeQuality', // firefox property
        //-ms-interpolation-mode: 'bicubic',  // IE property
        width: '100%'
      });
    };

    // add handler to images to call after finished loading
    function addLoadHandler() {
      var img = $img.get(0);
      if(img.complete) {
        initListItem();
      } else {
        $img.bind('load readystatechange', imageLoadHandler)
        .bind('error', function () {
          $img.css('visibility', 'visible').parent().removeClass(options.loadingClass);
        });
      }
    };


    // event handler for image loading
    function imageLoadHandler(e) {
      var img = $img.get(0);
      if (img.complete || (img.readyState === 'complete' && e.type === 'readystatechange')) {
        initListItem();
      }
    };


    // load handler for images
    function initListItem(){
      $img.css('visibility', 'visible').parent().removeClass(options.loadingClass);
      $img.fadeIn();

      self.isLoaded = true;
      initImageDimensions();

      self.$el.trigger('loaded', self);
    };


    // determine image dimensions
    function initImageDimensions() {
      var img = $img.get(0);

      // update full image dimensions
      if(typeof img.naturalWidth !== 'undefined') {
        self.w  = options.forceWidth || img.naturalWidth || img.width;
        self.h = options.forceHeight || img.naturalHeight || img.height;
      } else {
        var tmpImg = new Image();
        tmpImg.src = $img.attr('src');
        self.w = tmpImg.width;
        self.h = tmpImg.height;
      }

      // update thumbnail dimensions
      if(options.thumbWidth === 'auto' && options.thumbHeight === 'auto') {
        self.tw = options.loadingWidth;
        self.th = Math.round(self.h * options.loadingWidth / self.w);
      } else if (options.thumbHeight === 'auto') {
        self.tw = options.thumbWidth;
        self.th = Math.round(self.h * Number(options.thumbWidth) / self.w);
      } else if (options.thumbWidth === 'auto') {
        self.tw = Math.round(self.w * Number(options.thumbHeight) / self.h);
        self.th = options.thumbHeight;
      } else {
        self.tw = options.thumbWidth;
        self.th = options.thumbHeight;
      }
    };


    // Public API ==================================================

    init();
  };


  /** Basic jQuery plugin setup */
  $.fn.flowgallery = function(options) {

    return this.each(function() {
      var element = $(this);

      // Return early if this element already has a plugin instance
      if (element.data('flowgallery')) { return; }

      // pass options to plugin constructor
      var flowgallery = new FlowGallery(this, options);

      // Store plugin object in this element's data
      element.data('flowgallery', flowgallery);
    });

  };

  // default options
  $.fn.flowgallery.defaults = FlowGallery.defaults;


})( jQuery, window , document );
