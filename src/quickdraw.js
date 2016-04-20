function quickdraw(width, height){
    // main drawing object; like the stage in most frameworks

    // set up canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    // datastores
    this.layers = [];        //groups of renderable objects

    this.add = function(layer){
        // adds a qdlayer object to this stage

        layer.canvas.width = this.canvas.width;
        layer.canvas.height = this.canvas.height;
        this.layers.push(layer);

        // enforce z ordering
        this.layers.sort(function(a, b) {
            return a.z - b.z;
        });

    };

    this.render = function(){
        // draw that which must be drawn, and recompute touch targets

        var i, j;

        // clear the display canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for(i=0; i<this.layers.length; i++){
            // do we care about this layer?
            if(!this.layers[i].display || this.layers[i].members.length == 0) continue;

            // update the layer as needed
            if(this.layers[i].needsUpdate){
                // clear this layer's canvas
                this.layers[i].ctx.clearRect(0, 0, this.layers[i].canvas.width, this.layers[i].canvas.height);
                // redraw everything
                for(j=0; j<this.layers[i].members.length; j++){
                    // line size
                    this.layers[i].ctx.lineWidth = this.layers[i].members[j]._lineWidth;
                    // fill color or pattern
                    if(this.layers[i].members[j]._fillPriority == 'color' || !this.layers[i].members[j]._fillPatternImage)
                        this.layers[i].ctx.fillStyle = this.layers[i].members[j]._fillStyle;
                    else if(this.layers[i].members[j]._fillPriority == 'pattern')
                        this.layers[i].ctx.fillStyle = this.layers[i].ctx.createPattern(this.layers[i].members[j]._fillPatternImage, "repeat");
                    // line style
                    this.layers[i].ctx.strokeStyle = this.layers[i].members[j]._strokeStyle;

                    this.layers[i].ctx.fill(this.layers[i].members[j]._path);
                    this.layers[i].ctx.stroke(this.layers[i].members[j]._path);
                }
                this.layers[i].needsUpdate = false;
            }

            // print the layer on the display canvas
            this.ctx.drawImage(this.layers[i].canvas, 0, 0);
        }
        this.updateTargets();
    },

    this.updateTargets = function(){
        // recompute plot interaction listeners
        
        var i, j;

        this.touchTargets = [];
        // build up touch target list in the right order (per-layer backwards)
        for(i=this.layers.length-1; i>=0; i--){
            // do we care about this layer?
            if(!this.layers[i].display || this.layers[i].members.length == 0) continue;

            // touch targets list
            for(j=this.layers[i].members.length-1; j>=0; j--){
                this.touchTargets.push(this.layers[i].members[j])
            }
        }  
    }

    this.mouseInteraction = function(evt){
        //handle a click interaction
        var i,
            bounds = this.canvas.getBoundingClientRect();

        for(i=0; i<this.touchTargets.length; i++){
            // are we touching shape i?
            if(this.ctx.isPointInPath(this.touchTargets[i]._path, evt.clientX - bounds.left, evt.clientY - bounds.top)){
                this.currentTouch = this.touchTargets[i];

                if(evt.type == 'click')
                    this.touchTargets[i]._click(evt.clientX - bounds.left, evt.clientY - bounds.top, evt);
                else if(evt.type == 'mousemove'){
                    if(!this.previousTouch){
                        //move from empty space to shape
                        this.currentTouch._mouseover(evt.clientX - bounds.left, evt.clientY - bounds.top, evt);
                    } else if(this.previousTouch.id !== this.currentTouch.id){
                        //left one shape and entered another
                        this.previousTouch._mouseout(evt.clientX - bounds.left, evt.clientY - bounds.top, evt);
                        this.currentTouch._mouseover(evt.clientX - bounds.left, evt.clientY - bounds.top, evt);
                    } else { 
                        //moving around in the same shape
                        this.touchTargets[i]._mousemove(evt.clientX - bounds.left, evt.clientY - bounds.top, evt);
                    }
                }
                this.previousTouch = this.currentTouch;
                // bail out immediately once something is successfully touched
                return 0
            } 
        }

        if(this.previousTouch){
            // move from shape to empty space
            this.previousTouch._mouseout(evt.clientX - bounds.left, evt.clientY - bounds.top, evt);
            this.previousTouch = null;
            this.currentTouch = null;
        }
    }
    // bind listeners
    this.canvas.onclick = this.mouseInteraction.bind(this);
    this.canvas.onmousemove = this.mouseInteraction.bind(this);
    this.canvas.onmouseout = function(){
        this.currentTouch = null;
        this.previousTouch = null;
    }.bind(this)

}

function qdshape(path, parameters){
    // constructor for a generic shape; path == Path2D object that defines the shape

    var propertySetter, interactionSetter;

    // default parameters
    this.id = parameters.id;
    this._path = path;
    this._lineWidth = parameters.lineWidth || 1;
    this._strokeStyle = parameters.strokeStyle || '#000000';
    this._fillStyle = parameters.fillStyle || '#000000';
    this.touchable = parameters.hasOwnProperty('touchable') ? parameters.touchable : true;
    this._z = parameters.z || 1;
    this._fillPriority = parameters.fillPriority || 'color';
    this._fillPatternImage = parameters.fillPatternImage || null;
    this.parentLayer = null;

    // dummy interaction callbacks
    this._click = function(){return 0};
    this._mouseover = function(){return 0};
    this._mousemove = function(){return 0};
    this._mouseout = function(){return 0};

    // setters flag layers for redraw
    propertySetter = function(variableName, setValue){
        this[variableName] = setValue;
        if(this.parentLayer)
            this.parentLayer.needsUpdate = true;
    };

    Object.defineProperty(this, 'path', {
        set: propertySetter.bind(this, '_path')
    });

    Object.defineProperty(this, 'lineWidth', {
        set: propertySetter.bind(this, '_lineWidth')
    });

    Object.defineProperty(this, 'strokeStyle', {
        set: propertySetter.bind(this, '_strokeStyle')
    });

    Object.defineProperty(this, 'fillStyle', {
        set: propertySetter.bind(this, '_fillStyle')
    });

    Object.defineProperty(this, 'z', {
        set: propertySetter.bind(this, '_z')
    });

    Object.defineProperty(this, 'fillPriority', {
        set: propertySetter.bind(this, '_fillPriority')
    });

    Object.defineProperty(this, 'fillPatternImage', {
        set: propertySetter.bind(this, '_fillPatternImage')
    });

    // mouse interaction setters
    interactionSetter = function(interactionName, callback){
        this[interactionName] = callback.bind(this);
    }

    Object.defineProperty(this, 'click', {
        set: interactionSetter.bind(this, '_click')
    });

    Object.defineProperty(this, 'mouseover', {
        set: interactionSetter.bind(this, '_mouseover')
    });

    Object.defineProperty(this, 'mousemove', {
        set: interactionSetter.bind(this, '_mousemove')
    });

    Object.defineProperty(this, 'mouseout', {
        set: interactionSetter.bind(this, '_mouseout')
    });
}

function qdlayer(name){
    // constructor for a layer; name == string name of layer

    this.display = true;
    this.members = [];
    this.needsUpdate = true;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.name = name;
    this.z = 1;

    this.add = function(shape){
        // adds a qdshape object to this layer
        shape.parentLayer = this;
        this.members.push(shape);
        this.needsUpdate = true;

        // enforce z ordering
        this.members.sort(function(a, b) {
            return a._z - b._z;
        });
    }
}
