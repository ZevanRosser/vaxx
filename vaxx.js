(function() {
  var WIDTH = 630,
      HEIGHT = 480;
  
  var fx, mouseX, mouseY;
  
  // debugging only
  mouseX = mouseY = 0;
  document.addEventListener('mousemove', function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
  });
  
  
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
  
  var Crackle = function() {
    this.p = new Particle();  
  };
  
  Crackle.prototype = {
    constructor: Crackle,
    reset: function() {
      this.p.x = Math.random() * WIDTH;
      this.p.y = Math.random() * HEIGHT;
      this.p.vx = this.p.vy = 0;
      this.t = 0;
      this.startTime = Math.random() * 300;
    },
    update: function(c) {
      this.t++;
      if (this.t < this.startTime) { return; }
      
      var leng = 100 + this.t;
      
      if (Math.random() < 0.01 || this.t > 200) {
        this.reset();  
        
      }
      for(var i = 0; i < leng; i ++) {
        if (Math.random() < 0.2) {
          this.p.vx += ((Math.random() * 8 - 4) - this.p.vx) / 6;
          this.p.vy += ((Math.random() * 8 - 4) - this.p.vy) / 6;
        }
        
        
        this.p.update();
        c.fillStyle = 'white';
        c.fillRect(this.p.x, this.p.y, 2, 2);
      }
    }
  };
  
  
  // custom worm particle
  var Worm = function() {
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
      this.maxAlpha = 0.1 + Math.random() * 0.3;
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
        c.fillStyle = `${this.col} ${this.alpha})`;
        c.beginPath();
        c.arc(this.p.x, this.p.y, this.size, 0, Math.PI * 2, false);
        c.fill();
        c.closePath();
      }
    };
    
    // main fx class
    var Fx = function(width, height) {
    var SIZE = width * height * 4,
    WORM_NUM = 400,
    CRACKLE_NUM = 20,
    SAMPLE_SIZE = 1024;
    
    var AudioContext, canvas, video, mediaPrefs, c, pixels,
    cv, contrast, factor, worms, worm, wormIndex,
    crackles, crackle, audioCtx, analyser, jsNode,
    amplitudes, audioStream;
    
    
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
  var frame = document.createElement('div');
  frame.classList.add('frame');
  document.body.appendChild(frame);
  frame.appendChild(canvas);
  
  c = canvas.getContext('2d');
  c.fillRect(0, 0, canvas.width, canvas.height);
  
  mediaPrefs = { video: true, audio: true };
  video = document.createElement('video');
 
  document.body.appendChild(video);
  // brightness and contrast 
  contrast = 10;
  factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  
  // create some worms
  worms = [];
  wormIndex = 0;
  
  for(var i = 0; i < WORM_NUM; i++) {
    worms.push(new Worm());  
  }
  
  // create some worms
  crackles = [];
  // wormIndex = 0;
  
  for(var i = 0; i < CRACKLE_NUM; i++) {
    var crackle = new Crackle();
    crackle.reset();
    crackles.push(crackle);  
  }
  
  AudioContext = window.webkitAudioContext || window.AudioContext;
  var audioCtx;
  try {
    audioCtx = new AudioContext();
  } catch(e) {
    alert('Web Audio API is not supported in this browser');
  }
  
  var initAudio = function(stream) {
    sourceNode = audioCtx.createMediaStreamSource(stream);
    audioStream = stream;
    analyser   = audioCtx.createAnalyser();
    jsNode = audioCtx.createScriptProcessor(SAMPLE_SIZE, 1, 1);
    
    amplitudes = new Uint8Array(analyser.frequencyBinCount);
    
    console.log(amplitudes.length);
    jsNode.onaudioprocess = function () {
      amplitudes = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(amplitudes);
    };
    // Now connect the nodes together
    // Do not connect source node to destination - to avoid feedback
    sourceNode.connect(analyser);
    analyser.connect(jsNode);
    jsNode.connect(audioCtx.destination);
  };
  
  // get the media
  if (navigator.getUserMedia) {  
    navigator.getUserMedia(mediaPrefs, function(stream) {
      video.src = stream;
      video.play();
      initAudio(stream);
    }, error);
  } else if (navigator.webkitGetUserMedia) {  
    navigator.webkitGetUserMedia(mediaPrefs, function(stream){
      video.src = window.webkitURL.createObjectURL(stream);
      video.play();
      initAudio(stream);
    }, error);
  } 
  

  // add some buffers, for frame differencing and other fx
  addBuffer('diff');
  addBuffer('prev');
  addBuffer('blur');
  addBuffer('buff');
  addBuffer('grad');
  
  cv.buff.fillStyle = 'black';
  cv.buff.fillRect(0, 0, width, height);
  
  var ddx = ddy = adx = ady = 0;
  
  var loop = function() {
    var r, g, b, cr, cg, cb, qi, worm, t, 
        xs, ys, wx, wy, clump, activeX, activeY, 
        activeZoom, avgX, avgY;
    
    // frame differencing
    cv.diff.drawImage(video, 0, 0);    
    cv.diff.globalCompositeOperation = 'difference';
    cv.diff.drawImage(cv.prevCanvas, 0, 0);
    cv.diff.globalCompositeOperation = 'normal';
    
    cv.prev.drawImage(video, 0, 0);
    
    pixels = cv.diff.getImageData(0, 0, width, height);
    
    xs = [];
    ys = [];
   
    activeX = 0,
    activeY = 0, 
    activeZoom = 3;
    avgX = avgY = 0;
    
    // draw some worms when there is motion
    if (Math.random() < 0.8) {
      for (var i = 0; i < SIZE; i += 4) {
        r = pixels.data[i];
        
        if (r > 50 && Math.random() < 0.2) {
          qi = i / 4;
          worm = worms[wormIndex++ % WORM_NUM];
          
          if (!worm.active) {
            t = Math.PI * 2 * Math.random();
            wx = qi % width + 10 * Math.cos(t);
            wy = qi / width + 10 * Math.random(t);
            
            // @TODO figure out colors
            worm.reset(wx, wy, 255, 255, 255);
            
            // find the main area of activity for panning
            // and zooming the camera
            if (!clump) {
              xs.push(wx);
              ys.push(wy);
            }
            
            if (xs.length > 20) {
              for (var i = 0; i < xs.length; i ++) {
                avgX += xs[i];
                avgY += ys[i];
              }
              
              avgX /= xs.length;
              avgY /= ys.length;
              activeX = avgX;
              activeY = avgY; 
              clump = true;
            }
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
    
    if (amplitudes) {
      var minValue = 9999999;
      var maxValue = 0;
      for (var i = 0; i < amplitudes.length; i++) {
        var value = amplitudes[i] / 256;
        if(value > maxValue) {
          maxValue = value;
        } else if(value < minValue) {
          minValue = value;
        }
      }
      
      if (maxValue < 0.6) {
        maxValue /= 30;
      } else {
        maxValue /= 4;
      }
      
      // add a very subtle scaled video feedback effect
      cv.blur.globalAlpha = 1;
      cv.blur.save();
      // cv.blur.translate(-width * 0.005, -height * 0.005);
      // cv.blur.scale(1.01, 1.01);
      var halfValue = maxValue / 2;
      cv.blur.translate(-width * halfValue, -height * halfValue);
      cv.blur.scale(1 + maxValue, 1 + maxValue);
      cv.blur.drawImage(canvas, 0, 0);
      cv.blur.restore();
      
      for (var i = 0; i < CRACKLE_NUM; i++) {
        crackles[i].update(cv.blur);
      }
    }
    
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
    
    cv.grad.putImageData(pixels, 0, 0);

    if (clump) {
      adx = activeX;
      ady = activeY;  
    }
    
    ddx += (adx - ddx) / 12;
    ddy += (ady - ddy) / 12;
    
    /*
    c.save();
    c.translate(activeX,  activeY);
    c.scale(activeZoom, activeZoom);
    c.translate(-activeX, -activeY);
    
    c.drawImage(cv.gradCanvas, 0, 0);
    c.restore();*/

    c.drawImage(cv.gradCanvas, 0, 0);
    
    activeZoom = 2;
    
    var zzz = `translate3d(${ddx}px, ${ddy}px, 0) scale3d(${activeZoom}, ${activeZoom}, 1) translate3d(-${ddx}px, -${ddy}px, 0)`;
     
    
    // frame.style.transform = zzz;
    
    requestAnimationFrame(loop);
  };
  
  loop();
};
 
 // start
 fx = new Fx(WIDTH, HEIGHT);

})();