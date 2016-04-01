(function() {
  var fx, mouseX, mouseY;
  
  /*
  mouseX = mouseY = 0;
  
  document.addEventListener('mousemove', function(e) {
  mouseX = e.pageX;
  mouseY = e.pageY;
});
  */
  
  // basic particle
  var Particle = function(p) {
    this.x = this.y = 0;
    this.vx = this.vy = 1;
  };
  
  Particle.prototype = {
    constructor: Particle,
    update: function() {
      this.x += this.vx;
      this.y += this.vy;  
    }
  };
  
  // custom worm particle
  var Worm = function(p) {
    this.p = new Particle();  
  };
  
  Worm.prototype = {
    constructor: Worm,
    reset: function(x, y, r, g, b) {
      // set worm particle properties
      this.active = true;
      this.p.x = x;
      this.p.y = y;
      this.p.vx = 0;
      this.p.vy = 0;
      this.maxAlpha = 0.2 + Math.random() * 0.2;
      this.alphaSpeed = 0.01 * Math.random() + 0.01;
      this.vRad = Math.random() * 3;
      this.t = Math.random() * 2 * Math.PI;
      this.ti = Math.random() * 0.2 - 0.1;
      this.size = 1 + Math.random() * 4;
      
      this.alpha = 0;
      this.phase = 1;
      this.damp = 16 + Math.random() * 4;
      
      // sometimes make a long lasting reddish particle
      if (Math.random() < 0.005) {
        this.maxAlpha = 0.8;  
        this.alphaSpeed = 0.005;
        r = 255;
        g = b = Math.floor(Math.random() * 255);
        this.vRad = 6;
      }
      
      // sometimes make a large particle with a low alpha
      if (Math.random() < 0.3) {
        this.size = Math.random() * 20 + 10 ;
        this.maxAlpha /= 3;
      }
      
      this.col = `rgba(${r}, ${g}, ${b},`;
                       },
                       
                       update: function(c) {
        if (!this.active) { return; }
        
        // polar coordinates determine destination velocity
        this.dx = this.vRad * Math.cos(this.t);
        this.dy = this.vRad * Math.sin(this.t);
        
        // randomly alter spped and direction
        if (Math.random() < 0.1) {
          this.vRad = Math.random() * 3;
          this.t = Math.random() * 2 * Math.PI;
        }
        
        // ease-out to destination velocity
        this.p.vx += (this.dx - this.p.vx) / this.damp;
        this.p.vy += (this.dy - this.p.vy) / this.damp;
        
        // increment theta
        this.t += this.ti;
        
        this.p.update();
        
        // fade the worm in
        if (this.phase === 1) {
          this.alpha += 0.05;
          if (this.alpha > this.maxAlpha) {
            this.alpha = this.maxAlpha;
            this.phase = 2;  
          }
          
          // fade the worm out
        } else if (this.phase === 2) {
          this.alpha -= this.alphaSpeed;
          if (this.alpha <= 0) {
            this.active = false;
          }
        }
        
        // draw the worm
        c.fillStyle = `${this.col} ${this.alpha})`;;
        c.beginPath();
        c.arc(this.p.x, this.p.y, this.size, 0, Math.PI * 2, false);
        c.fill();
        c.closePath();
      }
    };
    
    // main fx class
    var Fx = function(width, height) {
    var SIZE = width * height * 4,
    WORM_NUM = 400;
    
    var canvas, video, mediaPrefs, c, pixels,
    cv, contrast, factor, worms, wormIndex;
    
    var error = function(error) {
    alert('video error', error.code); 
  };
  
  var createCanvas = function() {
    var canvas;
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };
  
  var addBuffer = function(name) {
    var canvas;
    canvas = createCanvas();
    cv[name] = canvas.getContext('2d');
    cv[name + 'Canvas'] = canvas;
  };
  
  cv = {};
  canvas = createCanvas();
  document.body.appendChild(canvas);
  
  c = canvas.getContext('2d');
  c.fillRect(0, 0, canvas.width, canvas.height);
  
  mediaPrefs = { video: true, audio: false };
  video = document.createElement('video');
  
  // brightness and contrast 
  contrast = 10;
  factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  
  // create some worms
  worms = [];
  wormIndex = 0;
  
  for(var i = 0; i < WORM_NUM; i++) {
    worms.push(new Worm());  
  }
  
  // get the media
  if (navigator.getUserMedia) {  
    navigator.getUserMedia(mediaPrefs, function(stream) {
      video.src = stream;
      video.play();
    }, error);
  } else if (navigator.webkitGetUserMedia) {  
    navigator.webkitGetUserMedia(mediaPrefs, function(stream){
      video.src = window.webkitURL.createObjectURL(stream);
      video.play();
    }, error);
  } 
  
  // add some buffers, for frame differencing and other fx
  addBuffer('diff');
  addBuffer('prev');
  addBuffer('blur');
  addBuffer('buff');
  
  cv.buff.fillStyle = 'black';
  cv.buff.fillRect(0, 0, width, height);
  
  var loop = function() {
    var r, g, b, cr, cg, cb, qi, worm, t;
    
    // frame differencing
    cv.diff.drawImage(video, 0, 0);    
    cv.diff.globalCompositeOperation = 'difference';
    cv.diff.drawImage(cv.prevCanvas, 0, 0);
    cv.diff.globalCompositeOperation = 'normal';
    
    cv.prev.drawImage(video, 0, 0);
    
    pixels = cv.diff.getImageData(0, 0, width, height);
    
    // draw some worms when there is motion
    if (Math.random() < 0.8) {
      for (var i = 0; i < SIZE; i += 4) {
        r = pixels.data[i];
        
        if (r > 50 && Math.random() < 0.2) {
          qi = i / 4;
          worm = worms[wormIndex++ % WORM_NUM];
          
          if (!worm.active) {
            t = Math.PI * 2 * Math.random();
            worm.reset(
              qi % width + 10 * Math.cos(t),
              qi / width + 10 * Math.random(t),
              255, 255, 255
            );
          }
        }
      }
    }
    
    for (var i = 0; i < WORM_NUM; i++) {
      if (worms[i].active) {
        worms[i].update(cv.diff);
      }
    }
    
    // combine actual video feed and frame differencing
    // for a trail effect
    cv.buff.globalCompositeOperation = 'lighten';
    cv.buff.drawImage(video, 0, 0);
    cv.buff.drawImage(cv.diffCanvas, 0, 0);
    cv.buff.globalAlpha = 0.02;
    cv.buff.globalCompositeOperation = 'darken';
    cv.buff.drawImage(cv.diffCanvas, 0, 0);
    
    // add a very subtle scaled video feedback effect
    cv.blur.globalAlpha = 1;
    cv.blur.save();
    cv.blur.translate(-width * 0.005, -height * 0.005);
    cv.blur.scale(1.01, 1.01);
    cv.blur.drawImage(canvas, 0, 0);
    cv.blur.restore();
    
    cv.buff.globalCompositeOperation = 'normal';
    cv.buff.globalAlpha = 0.12;
    cv.buff.drawImage(cv.blurCanvas, 0, 0);
    cv.buff.globalAlpha = 1;
    
    // draw the buffer to the main context
    c.drawImage(cv.buffCanvas, 0, 0);
    
    // brightness and contrast
    pixels = c.getImageData(0, 0, 640, 480);
    
    for (var i = 0; i < SIZE; i += 4) {
      r = pixels.data[i] - 30;
      g = pixels.data[i + 1] - 5;
      b = pixels.data[i + 2] ;
      
      cr = factor * (r - 128) + 128;
      cg = factor * (g - 128) + 128;
      cb = factor * (b - 128) + 128;
      
      if (cr > 255) cr = 255;
      if (cg > 255) cg = 255;
      if (cb > 255) cb = 255;
      
      pixels.data[i] = cr;
      pixels.data[i + 1] = cg;
      pixels.data[i + 2] = cb;
    }
    
    c.putImageData(pixels, 0, 0);
    requestAnimationFrame(loop);
  };
  
  loop();
};
 
 // start
 fx = new Fx(640, 480);

})();