## quickdraw

Quickdraw is a specialized javascript framework for making high-performance interactive images, originally built for the GRIFFIN spectrometer at TRIUMF; it supports simple layer compositing, mouse interactions, *and that's it*. Quickdraw is *not* a full-featured HTML5 canvas games library! For that, check out projects like [pixi.js](http://www.pixijs.com/) and [three.js](http://threejs.org/).

### 1. Quickdraw Quickstart

A quick tour of quickdraw is available in `demo.html`; open that file up in your favorite browser, and follow along with the inline comments.

### 2. API

Drawing with quickdraw relies on four main objects; a top-level `quickdraw` object (which is a lot like the 'stage' in other drawing frameworks); `qdlayer` objects, which are groups of shapes smart enough to only re-draw themselves when they've actually changed; `qdshape` objects, which are shapes defined by [Path2D objects](https://developer.mozilla.org/en-US/docs/Web/API/Path2D); and `qdtext` objects, which are text objects that otherwise work much like `qdshape` objects.

#### 2.1 the `quickdraw` object

Start drawing with quickdraw by creating a new `quickdraw` object:

```
var qd = new quickdraw(width_px, height_px);
```

##### Members

 - **`qd.canvas`**: the `canvas` DOM element that the final visualization will be drawn to.
 - **`qd.ctx`**: the 2D context associated with `qd.canvas`.
 - **`qd.layers`**: the collection of `qdlayer` objects associated with this object.

##### Methods

 - **`qd.add(layer)`**: adds a `qdlayer` object to the stack of layers to compose the final image.
 - **`qd.render()`**: draw the latest version of the final image.

#### 2.2 `qdlayer` objects

All images in quickdraw are collected in groups called layers; these layers can be stacked on top of each other to create foreground / background effects, and are represented by `qdlayer` objects. Create a new layer via:

```
var myLayer = new qdlayer(name)
```

where `name` is a string naming this layer.

##### Members

 - **`myLayer.display`**: boolean, default `true`. Determines if this layer should be drawn in the final image.
 - **`myLayer.members`**: array of `qdshape` objects that have been assigned to this layer.
 - **`myLayer.needsUpdate`**: boolean to determine whether this layer will be redrawn on the next call to the associated `quickdraw` object's `render` method.
 - **`myLayer.canvas`**: an unrendered `canvas` element that this layer will be drawn to before final composition.
 - **`myLayer.ctx`**: the 2D context associated with `myLayer.canvas`.
 - **`myLayer.name`**: the string passed in to the `qdlayer` constructor.
 - **`myLayer.z`**: integer, default 1. z index of this layer; higher z indices will be drawn on top of lower z indices.

##### Methods

 - **`myLayer.add(shape)`**: adds a `qdshape` or `qdtext` object to this layer.

#### 2.3 `qdshape` objects

All shapes renderd to the canvas can have their border and fill colors and styles set, and also support click, mouse-over, mouse-move, and mouse-out interactions. Create a new shape via:

```
var myShape = new qdshape(path, parameters)
```

where `path` is a [path2D object](https://developer.mozilla.org/en-US/docs/Web/API/Path2D) that descirbes the boundary of the shape you'd like to draw, and `parameters` is an optional JSON object initializing any subset of the member variables listed below.

##### Members

All members are set by their name, like `myShape.flavour = 'strawberry'`, but are accessed by the name prefixed with an underscore, like `myFlav = myshape._flavour`. **Do not** set values directly on the underscored variables - this will break the automatic redraw and lead to unanticipated behvior.

 - **myShape.id**: string, defualt null; an id attribute for this shape.
 - **myShape.path**: a `Path2D` object that defines the perimeter of this shape, set by the first argument in the `qdshape` constructor.
 - **myShape.lineWidth**: integer, defualt 1; the width in pixels of this shape's border.
 - **myShape.strokeStyle**: RGB color code, default `#000000`; the color of the shape's border.
 - **myShape.fillStyle**: RGB color code, default `#000000`; color to fill the shape with if `myShape.fillPriority == 'color'`
 - **myShape.touchable**: boolean, default true; whether or not mouse interactions will be enabled on this shape.
 - **myShape.x**: float, default 0: x-coordinate of center of rotation for this object.
 - **myShape.y**: float, default 0: y-coordinate of center of rotation for this object.
 - **myShape.z**: integer, default 1; z-index of this shape *within its layer*; note that all objects regardless of z index will be drawn on top of this shape if they belong to a `qdlayer` with z index higher than this shape's layer's z index.
 - **myShape.internalRotation **: float, default 0; rotation angle in radians around the point `myShape.x, myShape.y`.
 - **myShape.fillPriority**: string, 'color' or 'pattern', default 'color'; will this shape be filled with its `fillStyle` color or its `fillPatternImage` image?
 - **myShape.fillPatternImage**: `<img>` object, defualt `null`; image to fill shape with if `myShape.fillPriority == 'pattern'`
    this.parentLayer = null;
 - **myShape.parentLayer**: `qdlayer` object, default `null`; the layer this shape belongs to. Set via the `qdlayer`'s `add` method.

##### Listeners

Mouse interaction listener naming and setting conventions follow the same underscore rule as the regular members. A shape's mouse interactions will only fire if it is **not** obscured by another shape at higher z listening for events (ie, if the shape is visible, or only covered by shapes with `myShape.touchable == false`).

 - **myShape.click**: function called when the shape is clicked on.
 - **myShape.mouseover**: function called when the mouse first enters the shape.
 - **myShape.mousemove**: function called every time the mouse moves within the shape.
 - **myShape.mouseout**: function called when the mouse leaves the shape.

#### 2.4 `qdtext` objects

Text nodes are declared and added to layers similarly to `qdshape` objects:

```
var myText = new qdtext(text, parameters)
```

where `text` is a string describing the text you'd like to add to your image, and `parameters` is an optional JSON object initializing any subset of the member variables listed below.

##### Members

 - **myText.id**: string, defualt null; an id attribute for this shape.
 - **myText.text**: string passed in by the first parameter in the `qdtext` constructor.
 - **myText.fontSize**: integer, default 12; font size of text.
 - **myText.typeface**: string, default 'sans-serif'; typeface for text.
 - **myText.strokeStyle**: RGB color code, default `#000000`; edge color of text.
 - **myText.fillStyle** RGB color code, default `#000000`; fill color of text.
 - **myText.x**: float, default 0; left edge in pixels of text.
 - **myText.y**: float, default 0; bottom edge in pixels of text.
 - **myText.z**: integer, default 1; z-index of this text *within its layer*.
 - **myText.parentLayer**: `qdlayer` object, default `null`; the layer this text belongs to. Set via the `qdlayer`'s `add` method.;

##### Methods

 - **myText.getTextMetric()**: Returns the [TextMetrics](https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics) object for the text with its current font, size etc.

### 3. Contributing

Quickdraw is pretty raw atm - if you see this as potentially becoming useful in your work, feel free to send a pull request! If you'd like to get involved, please observe these steps:

 - **Start by opening an issue** so we can discuss your idea.
 - **Try to limit each individual PR to less than 500 lines.** Why? See figure 1 [here](https://smartbear.com/SmartBear/media/pdfs/11_Best_Practices_for_Peer_Code_Review.pdf).
 - Please try to encapsulate all new functionality in **short** (<50 lines) functions.
 - Docs **must** be updated to match new functionality in the same PR.
 - Testing mandatory... once I implement a test suite. 