
# FlowGallery #

jQuery plugin for image galleries with a cover flow effect.

Demo and Documentation: http://flowgallery.org

## Usage ##

The required markup for the image gallery is a simple unordered list of images:

    <ul id="gallery-multi">
        <li>
        <ul>
            <li><img src="..." title="image caption text" alt="image" /></li>
            <li><img src="..." title="image caption text" alt="image" /></li>
            <li><img src="..." title="image caption text" alt="image" /></li>
        </ul>
        </li>
        <li>
        <ul>
            <li><img src="..." title="image caption text" alt="image" /></li>
            <li><img src="..." title="image caption text" alt="image" /></li>
            <li><img src="..." title="image caption text" alt="image" /></li>
        </ul>
        </li>
        <li>
        <ul>
            <li><img src="..." title="image caption text" alt="image" /></li>
            <li><img src="..." title="image caption text" alt="image" /></li>
            <li><img src="..." title="image caption text" alt="image" /></li>
        </ul>
        </li>
    </ul>

For basic usage with default settings, select the appropriate list and initialize as follows: 

<pre>
$("#gallery").flowGallery({
  easing: 'easeOutCubic',
});
</pre>

There are many additional configuration options, see project website for more details: http://flowgallery.org.

## Example additional feature ##

### Multiple rows of photos ###

Allow multiple row of photos to be shown, each move with each other in synchronous mode

    <ul id="gallery">
        <ul>
          <li><img src="..." title="image caption text" alt="image" /></li>
          <li><img src="..." title="image caption text" alt="image" /></li>
          <li><img src="..." title="image caption text" alt="image" /></li>
        </ul>
        <ul>
          <li><img src="..." title="image caption text" alt="image" /></li>
          <li><img src="..." title="image caption text" alt="image" /></li>
          <li><img src="..." title="image caption text" alt="image" /></li>
        </ul>
        <ul>
          <li><img src="..." title="image caption text" alt="image" /></li>
          <li><img src="..." title="image caption text" alt="image" /></li>
          <li><img src="..." title="image caption text" alt="image" /></li>
        </ul>
    </ul>

This can be controlled by the multirowsync attribute.

<pre>
$("#gallery").flowGallery({
  multirow: true,
  easing: 'easeOutCubic',
});
</pre>


### Putting elements in an arc ###

Thumbnails to be placed in an arc

<pre>
$("#gallery").flowGallery({
  arcradius: 500,
  rotate: 'auto',   // can specifiy absolute number, auto to fllow circle
  // arcsegment: 0.4 // TODO: segment of arc to be used
  easing: 'easeOutCubic',
});
</pre>


## Dependencies ##

* jQuery (tested with 1.4+)
* Optional: jQuery Easing (http://gsgd.co.uk/sandbox/jquery/easing/) for additional easing options

## Browser Compatibility ##

Tested under:

* Firefox 3.5+
* Safari 5
* Chrome 4+
* Opera 11
* IE7+

## Licensing ##

Copyright (c) 2012 [Boris Searles](http://lucidgardens.com), released under [MIT](http://www.opensource.org/licenses/mit-license.php) license.

