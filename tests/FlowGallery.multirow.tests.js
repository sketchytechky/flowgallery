describe("FlowGallery.multi", function() {

  describe("basic setup with multi-gallery config", function() {
    var $gallery, $el, api, clock,
        fullImageHeight = 400,
        fullImageWidth = 250;

    beforeEach(function() {
      clock = sinon.useFakeTimers();

      loadFixtures('multi_gallery.html');

      $el = $('#jasmine-fixtures');
      $gallery = $('#gallery');
      SpecHelper.loadFakeImages($gallery, fullImageWidth, fullImageHeight);
      $gallery.flowgallery({
          multirow : true
      });
      api = $gallery.data('flowgallery');
    });

    afterEach(function() {
      clock.restore();
    });

    describe('multi-gallery list', function() {
      it('should be visible', function() {
        expect( $gallery.css('visibility') ).toEqual('visible');
      });

      it('should have 9 images', function() {
        expect( $gallery.find('img').length ).toEqual(9);
      });

      it('should set non-active images to thumbnail size', function() {
        var $images = $gallery.find('li').not('.active');
        var expectedHeight = Math.round(fullImageHeight * 100 / fullImageWidth);
        $images.each(function(index) {
          expect( $(this).width() ).toEqual(100); // set loadingWidth since both thumbHeight and thumbWidth set to 'auto'
          expect( $(this).height() ).toEqual(expectedHeight);
        });
      });

      it ('should be divided into multiple rows', function () {
        var $rows = $gallery.find('li ul');
        expect( $rows.length ).toEqual(3);
        $rows.each(function (i,e) {
          var $images = $(this).find('li');
          expect( $images.length ).toEqual(3);
          var expectedTop = i*100+100;
          $images.each(function(index) {
            expect( $(this).offset().top ).toEqual(expectedTop);
          });
        });
      });

      it('should be as wide as outer container', function() {
        var outerContainer = $gallery.parent().parent();
        expect( $gallery.width() ).toEqual(outerContainer.width());
      });
    });

    /*
    describe("active image", function() {
      var $active;

      beforeEach(function() {
        $active = $gallery.find('li').first();
      });

      it("should be first item in list", function() {
        expect( $active.hasClass('active') ).toEqual(true);
      });

      it("should be set to full size", function() {
        expect( $active.width() ).toEqual(fullImageWidth);
        expect( $active.height() ).toEqual(fullImageHeight);
      });

      it("should have title displayed as caption", function() {
        var captionText = $('.fg-caption', $el).text();
        expect( $active.find('img').attr('title') ).toEqual(captionText);
      });
    });
    */

    describe("synchronized movements", function () {
        //TODO 

    });

  });

});
