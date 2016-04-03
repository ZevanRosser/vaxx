/* \/\\/\/\/\/\/\\/\/\///\\/\/\.\./\/\/\

[ --= VAXX by Zevan Rosser (2 0 1 6) == ]

vaxx uses simple computer vision concepts
to something.... @TODO good description

/\/\/\//\/\/\/\/\/\/\//\/\/\ _ _ _ _ \| */

(function() {
  var WIDTH = 640,
      HEIGHT = 480;

  // @TODO global config:
  // -> particle intensity
  // -> video feedback intensity
  // etc...

  var fx, config, mouseX, mouseY;

  // common config values - sometimes need to be
  // adjusted based on lighting situation
  config = {
    wormAlpha: { min: 0.1, offset: 0.25 },
    feedbackAlpha: 0.12,
    vidContrast: 10
  };

  // debugging only
  mouseX = mouseY = 0;
  document.addEventListener('mousemove', function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
  });


  /*
    BaSiK P A R.TIC.L.E-` ` ` `
     - - increment position by velocity over t i m e
  */
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

  // \/\/\/\/\/\/\/\/\/\/ - . - =
  //  -- little crack/lightingboLT-typething....
  //\/\ \/ \\ /... \ --- ~~~~~
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
      var leng;

      this.t++;

      if (this.t < this.startTime) { return; }

      // /\/\ at least `1 0 0` steps long
      leng = 100 + this.t;

      if (Math.random() < 0.01 || this.t > 200) {
        this.reset();
      }

      //\/\/\/\/\/\/\/ psuedo-brownian motion
      // - - - ...
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


  /**********************
  W O R M ---- P a R t I c L e ```

  -- ( really more of a dot, but moves like a worm )

  *???????????????????????????? ? ? ?*/
  var Worm = function() {
    this.p = new Particle();
  };

  Worm.prototype = {

    constructor: Worm,

    reset: function(x, y, r, g, b) {

      // [[ set worm particle properties /\_
      this.active = true;
      this.p.x = x;
      this.p.y = y;
      this.p.vx = 0;
      this.p.vy = 0;
      this.maxAlpha = config.wormAlpha.min
        + Math.random() * config.wormAlpha.offset;
      this.alphaSpeed = 0.01 * Math.random() + 0.01;
      this.vRad = Math.random() * 3;
      this.t = Math.random() * 2 * Math.PI;
      this.ti = Math.random() * 0.2 - 0.1;
      this.size = 1 + Math.random() * 4;

      this.alpha = 0;
      this.phase = 1;
      this.damp = 16 + Math.random() * 4;

      /* Sometimes Make Å long lasting reddish particle ***/
      if (Math.random() < 0.005) {
        this.maxAlpha = 0.6;
        this.alphaSpeed = 0.005;
        r = 255;
        g = b = Math.floor(Math.random() * 255);
        this.vRad = 6;
      }

      // _sometimes_ make a large
      //                  particle with a low alpha)))))))
      if (Math.random() < 0.3) {
        this.size = Math.random() * 10 + 10 ;
        this.maxAlpha /= 5;
      }

      this.col = `rgba(${r}, ${g}, ${b},`;
    },

    update: function(c) {
      if (!this.active) { return; }

      // @ polar coordinates determine destination velocity @
      this.dx = this.vRad * Math.cos(this.t);
      this.dy = this.vRad * Math.sin(this.t);

      // ~~# randomly alter spped and direction #~~
      if (Math.random() < 0.1) {
        this.vRad = Math.random() * 3;
        this.t = Math.random() * 2 * Math.PI;
      }

      // ease-out__to__destination__velocitY ::::::::=
      this.p.vx += (this.dx - this.p.vx) / this.damp;
      this.p.vy += (this.dy - this.p.vy) / this.damp;

      // increment theta (-)
      this.t += this.ti;

      this.p.update();

      // fade the worm in /////////////////}
      if (this.phase === 1) {
        this.alpha += 0.05;

        if (this.alpha > this.maxAlpha) {
          this.alpha = this.maxAlpha;
          this.phase = 2;
        }

        // fade the worm out \\\\\\\\\{}
      } else if (this.phase === 2) {
        this.alpha -= this.alphaSpeed;

        if (this.alpha <= 0) {
          this.active = false;
        }
      }

      // D R A W THE WO R M
      c.fillStyle = `${this.col} ${this.alpha})`;
      c.beginPath();
      c.arc(this.p.x, this.p.y, this.size, 0, Math.PI * 2, false);
      c.fill();
      c.closePath();
    }
  };

  // MAIN F.X.
  var Fx = function(width, height) {
    var SIZE = width * height * 4,
        WORM_NUM = 50,
        CRACKLE_NUM = 20,
        SAMPLE_SIZE = 1024;

    var canvas, video, mediaPrefs, c, pixels,
        cs, contrast, factor, worms, worm, wormIndex,
        crackles, crackle, audioCtx, amplitudes, zoomCanv, frame;

    // @TODO clean up
    var mode = 'in', zfade = 1, zd = 1, modeCount = 0, targTime = 120;

    var ddx = ddy = adx = ady = bdx = bdy = 0;

    var activeX = activeY = 0;

    var zoomDest = 1;
    var activeZoom = 1;

    // buffer context map
    cs = {};


    /* \/\/\/\/\/\/\\\\/\/\/\/\\\//
    == fns
    /\/\/\//\/\/\/\/\/\/\\\/\//\/\/\*/

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

    // \ / \ / \ / \  / \ / \ / \  / \ / \\
    // - - easy way to have a bunch of contexts
    // . . . that act SORT OF LIKE layers
    var addBuffer = function(name) {
      var canvas;
      canvas = createCanvas();
      cs[name] = canvas.getContext('2d');
      cs[name + 'Canvas'] = canvas;
    };

    canvas = createCanvas();
    frame = document.createElement('div');
    frame.classList.add('frame');
    document.body.appendChild(frame);
    frame.appendChild(canvas);

    zoomCanv = createCanvas();
    zoomCanv.classList.add('zoom-canv');
    zoomCanv.width = canvas.width;
    zoomCanv.height = canvas.height;
    zoomCanv.ctx = zoomCanv.getContext('2d');
    document.body.appendChild(zoomCanv);

    c = canvas.getContext('2d');
    c.fillRect(0, 0, canvas.width, canvas.height);

    mediaPrefs = { video: true, audio: true };
    video = document.createElement('video');

    // !!! prevent audio feedbacK - thanks SO:::
    // http://stackoverflow.com/questions/34687073/web-audio-api-prevent-microphone-input-from-being-played-through-speakers?rq=1
    video.muted = true;

    document.body.appendChild(video);

    // brightness and contrast
    contrast = config.vidContrast;
    factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    // create some worms
    worms = [];
    wormIndex = 0;

    for(var i = 0; i < WORM_NUM; i++) {
      worms.push(new Worm());
    }

    // create crackles
    crackles = [];

    for(var i = 0; i < CRACKLE_NUM; i++) {
      var crackle = new Crackle();
      crackle.reset();
      crackles.push(crackle);
    }


    var audioCtx;
    try {
      audioCtx = new AudioContext();

      console.log(audioCtx);
    } catch(e) {
      alert('audio error - get a better browser');
    }

    var initAudio = function(stream) {
      var sourceNode, analyser, jsNode, analyser;

      sourceNode = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      jsNode = audioCtx.createScriptProcessor(SAMPLE_SIZE, 1, 1);

      amplitudes = new Uint8Array(analyser.frequencyBinCount);

      jsNode.onaudioprocess = function () {
        amplitudes = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(amplitudes);
      };

      sourceNode.connect(analyser);
      analyser.connect(jsNode);
      jsNode.connect(audioCtx.destination);
    };

    // get the media (((((((.)))))))
    if (navigator.getUserMedia) {
      navigator.getUserMedia(mediaPrefs, function(stream) {
        video.src = stream;
        video.play();
        initAudio(stream);
      }, error);
    } else if (navigator.webkitGetUserMedia) {
      navigator.webkitGetUserMedia(mediaPrefs, function(stream){
        video.src = window.URL.createObjectURL(stream);
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

    cs.buff.fillStyle = 'black';
    cs.buff.fillRect(0, 0, width, height);

    var loop = function() {
      var r, g, b, cr, cg, cb, qi, worm, t,
          xs, ys, wx, wy, clump, avgX, avgY,
          activeWorms, minAmp, maxAmp, amp;

      // frame differencing
      cs.diff.drawImage(video, 0, 0);
      cs.diff.globalCompositeOperation = 'difference';
      cs.diff.drawImage(cs.prevCanvas, 0, 0);
      cs.diff.globalCompositeOperation = 'normal';

      cs.prev.drawImage(video, 0, 0);

      pixels = cs.diff.getImageData(0, 0, width, height);

      xs = [];
      ys = [];
      avgX = avgY = 0;
      activeWorms = 0;

      /* Analize and derive information from video activity...
         1) Where do we want to put some worms?
         2) Where is the main area (clump) of activity on the cam feed
                    (i f a n y)
      ****/
      if (Math.random() < 0.8) {
        for (var i = 0; i < SIZE; i += 4) {
          r = pixels.data[i];

          if (r > 50 && Math.random() < 0.2) {
            qi = i / 4;
            worm = worms[wormIndex++ % WORM_NUM];
            activeWorms++;
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

              if (xs.length > 4) {
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

      // R E N D E R -- W O R M Z
      for (var i = 0; i < WORM_NUM; i++) {
        if (worms[i].active) {
          worms[i].update(cs.diff);
        }
      }

      // combine actual video feed and frame differencing
      // for a trail effect
      cs.buff.globalCompositeOperation = 'lighten';
      cs.buff.drawImage(video, 0, 0);
      cs.buff.drawImage(cs.diffCanvas, 0, 0);
      cs.buff.globalAlpha = 0.02;
      cs.buff.globalCompositeOperation = 'darken';
      cs.buff.drawImage(cs.diffCanvas, 0, 0);

      if (amplitudes) {
        minAmp = 0xFFFFF;
        maxAmp = 0;

        for (var i = 0; i < amplitudes.length; i++) {
          amp = amplitudes[i] / 256;
          if(amp > maxAmp) {
            maxAmp = amp;
          } else if(amp < minAmp) {
            minAmp = amp;
          }
        }

        maxAmp = (maxAmp < 0.6) ? maxAmp / 30 : maxAmp / 4;

        // if (maxAmp < 0.6) {
        //   maxAmp /= 30;
        // } else {
        //   maxAmp /= 4;
        // }

        // add a very subtle scaled video feedback effect
        cs.blur.globalAlpha = 1;
        cs.blur.save();
        // cs.blur.translate(-width * 0.005, -height * 0.005);
        // cs.blur.scale(1.01, 1.01);
        var halfValue = maxAmp / 2;
        cs.blur.translate(-width * halfValue, -height * halfValue);
        cs.blur.scale(1 + maxAmp, 1 + maxAmp);
        cs.blur.drawImage(canvas, 0, 0);
        cs.blur.restore();

        for (var i = 0; i < CRACKLE_NUM; i++) {
          crackles[i].update(cs.blur);
        }
      }

      cs.buff.globalCompositeOperation = 'normal';
      cs.buff.globalAlpha = config.feedbackAlpha;
      cs.buff.drawImage(cs.blurCanvas, 0, 0);
      cs.buff.globalAlpha = 1;

      // draw the buffer to the main context
      c.drawImage(cs.buffCanvas, 0, 0);

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

      cs.grad.putImageData(pixels, 0, 0);


      if (clump) {
        adx = activeX;
        ady = activeY;
        if (Math.random() < 0.025) {
          var rand = 1.5 + Math.random() * .4;
          if (activeZoom === 1) {
            zoomDest = rand;
          }
          activeZoom = rand;
        }

        // activeZoom = 4;

      } else

      if (Math.random() < 0.05) {
         //  activeZoom = 1;
        }


      zoomDest += (activeZoom - zoomDest) / 22;

      ddx -= bdx;
      ddy -= bdy;

      /* - -  elastic camera
      bdx = ((ddx - adx) / 8 + bdx) / 1.5;
      bdy = ((ddy - ady) / 8 + bdy) / 1.5;*/


      //  zeno cam
      ddx += (adx - ddx) / 22;
      ddy += (ady - ddy) / 12;


      c.drawImage(cs.gradCanvas, 0, 0);


      if (Math.random() < 0.1 && mode === 'out') {
        mode = 'wait';
        clearTimeout(window.outOut);
        window.outOut = setTimeout(function() {
          mode = 'in';
        }, 1000 + Math.random() * Math.random() * 3000);
        // modeCount = 0;
        // targTime = 10 + Math.random() * 30;
      }

      if (Math.random() < 0.1 && mode === 'in') {
        mode = 'wait';
        clearTimeout(window.outOut);
        window.outOut = setTimeout(function() {
          mode = 'out';
        }, 1000 + Math.random() * Math.random() * 3000);

        // modeCount = 0;
        // targTime = 10 + Math.random() * 30;
      }

      modeCount++;

      if (mode === 'out') {
        zFade = 0;
      } else if (mode === 'in') {
        zFade = 1;
      }

     zoomCanv.ctx.drawImage(cs.gradCanvas, 0, 0);
     var camTrans = `
          translate3d(${window.innerWidth / 2 }px, ${window.innerHeight / 2}px, 0)
          translate3d(${ddx}px, ${ddy}px, 0)
          scale3d(${zoomDest}, ${zoomDest}, 1)
          translate3d(-${ddx }px, -${ddy }px, 0)
          translate3d(-${(width / 2) / activeZoom}px, -${(height / 2)  / activeZoom}px, 0)
          `;


      zd += (zFade - zd) / 4;
      zoomCanv.style.opacity = zd;

      frame.style.transform = camTrans;

      requestAnimationFrame(loop);
    };

    loop();
  };


 // start
 fx = new Fx(WIDTH, HEIGHT);

})();
