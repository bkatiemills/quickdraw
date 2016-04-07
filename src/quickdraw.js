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

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for(i=0; i<this.layers.length; i++){
            // do we care about this layer?
            if(!this.layers[i].display || this.layers[i].members.length == 0) continue;

            // update the layer as needed
            if(this.layers[i].needsUpdate){
                // clear the existing canvas
                this.layers[i].ctx.clearRect(0, 0, this.layers[i].canvas.width, this.layers[i].canvas.height);
                // redraw everything
                for(j=0; j<this.layers[i].members.length; j++){
                    this.layers[i].ctx.lineWidth = this.layers[i].members[j].lineWidth;
                    this.layers[i].ctx.fillStyle = this.layers[i].members[j]._fillStyle;
                    this.layers[i].ctx.strokeStyle = this.layers[i].members[j].strokeStyle;

                    this.layers[i].ctx.fill(this.layers[i].members[j].path);
                    this.layers[i].ctx.stroke(this.layers[i].members[j].path);
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

    this.clickInteraction = function(evt){
        //handle a click interaction
        var i,
            bounds = this.canvas.getBoundingClientRect();

        for(i=0; i<this.touchTargets.length; i++){
            if(this.ctx.isPointInPath(this.touchTargets[i].path, evt.clientX - bounds.left, evt.clientY - bounds.top)){
                console.log(this.touchTargets[i]._fillStyle)
                return 0
            }
        }
    }
    this.canvas.onclick = this.clickInteraction.bind(this);

}

function qdshape(path){
    // constructor for a generic shape; path == Path2D object that defines the shape

    this.path = path;
    this.lineWidth = 1;
    this.strokeStyle = '#000000';
    this._fillStyle = '#000000';
    this.touchable = true;
    this.z = 1;
    this.parentLayer = null;

    // setters flag layers for redraw
    Object.defineProperty(this, 'fillStyle', { 
        set: function(fs){ 
            this._fillStyle = fs;
            if(this.parentLayer)
                this.parentLayer.needsUpdate = true; 
        } 
    })
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
            return a.z - b.z;
        });
    }
}
