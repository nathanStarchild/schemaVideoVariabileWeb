var sizeWidth   = 1920//6142;
var sizeHeight  = 1080//3425;

var gl;
var c;

var viewportData;

// Global uniforms
var timeLocation, viewportLocation;

window.onload = loadShaders;

// Time vars
var startTime = new Date();
var elapsedTime;
var nowtime;

var shaderText = {};

class Perlin {
  constructor() {
      // Quick and dirty permutation table
      this.perm = (() => {
          const tmp = Array.from({length: 256}, () => Math.floor(Math.random() * 256));
          return tmp.concat(tmp);
      })();
  }

  grad(i, x) {
      const h = i & 0xf;
      const grad = 1 + (h & 7);

      if ((h & 8) !== 0) {
          return -grad * x;
      }

      return grad * x;
  }

  getValue(x) {
      const i0 = Math.floor(x);
      const i1 = i0 + 1;

      const x0 = x - i0;
      const x1 = x0 - 1;

      let t0 = 1 - x0 * x0;
      t0 *= t0;

      let t1 = 1 - x1 * x1;
      t1 *= t1;

      const n0 = t0 * t0 * this.grad(this.perm[i0 & 0xff], x0);
      const n1 = t1 * t1 * this.grad(this.perm[i1 & 0xff], x1);

      return 0.395 * (n0 + n1); //Output is between -1 and 1.
  }
}

// const noise = new Perlin();

function lerp(a, b, n) {
  return (1 - n) * a + n * b;
}

function lerpColour(c1, c2, n) {
  return [
    Math.round(lerp(c1[0], c2[0], n)),
    Math.round(lerp(c1[1], c2[1], n)),
    Math.round(lerp(c1[2], c2[2], n)),
  ]
}

function easeInOutQuad(t) {
  return t<.5 ? 2*t*t : -1+(4-2*t)*t
}

function easeOutElastic(x, t, b, c, d) {
  var s=1.70158;var p=0;var a=c;
  if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
  if (a < Math.abs(c)) { a=c; var s=p/4; }
  else var s = p/(2*Math.PI) * Math.asin (c/a);
  return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
}

function loadShaders() {
  loadShader('vertex', false);
  loadShader('fragment', true);
}

function loadShader(shaderType, finished) {
  var shader = $('script[type="x-shader/x-'+shaderType+'"]');
  let url = shader.data("src");

  var onComplete = function onComplete(jqXHR,  textStatus) {
    shaderText[shaderType] = jqXHR.responseText;
    if (finished) {
      init();
    }
  }

  $.ajax(
    {
      url: url,
      dataType: "text",
      context: {
        type: shaderType,
        finished: finished
      },
      complete: onComplete
    }
  );
}

function resizeCanvas() {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = c.clientWidth;
    var displayHeight = c.clientHeight;
    // console.log(displayHeight);
    // console.log(c);
   
    // Check if the canvas is not the same size.
    if (c.width  != displayWidth ||
        c.height != displayHeight) {
   
      // Make the canvas the same size
      c.width  = displayWidth;
      c.height = displayHeight;
    }
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  viewportData = [gl.getParameter(gl.VIEWPORT)[2], gl.getParameter(gl.VIEWPORT)[3]];

}

function throwOnGLError(err, funcName, args) {
  throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
};

function init() {

  c             = document.getElementById("theCanvas");
  gl            = WebGLDebugUtils.makeDebugContext(c.getContext("webgl"), throwOnGLError);
//   gl            = c.getContext('webgl');
  c.width       = window.innerWidth;
  c.height      = window.innerHeight;
  
  // resize the canvas to fill browser window dynamically
  window.addEventListener('resize', resizeCanvas, false);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Store current viewport data to pass it to fragment shader later
  viewportData = [gl.getParameter(gl.VIEWPORT)[2], gl.getParameter(gl.VIEWPORT)[3]];

  //console.log(viewportData);
  //console.log(gl.getParameter(gl.MAX_VIEWPORT_DIMS));
  
  // Buffer
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER, 
    new Float32Array([
      -1.0, -1.0, 
      1.0, -1.0, 
      -1.0,  1.0, 
      -1.0,  1.0, 
      1.0, -1.0, 
      1.0,  1.0]), 
    gl.STATIC_DRAW
    );

  let n = 10;
  let m = 10;
  var verts = [];


  // Vertex
  shaderSource = shaderText["vertex"];
  vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, shaderSource);
  gl.compileShader(vertexShader);


  // Fragment
  shaderSource = shaderText["fragment"];
  fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, shaderSource);
  gl.compileShader(fragmentShader);
  // console.log(gl.getShaderInfoLog(fragmentShader));


  program         = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);  
  gl.useProgram(program);



  // texcoordLocation = gl.getAttribLocation(program, "a_texCoord");//is this just in here for S&Gs?
  positionLocation = gl.getAttribLocation(program, "a_position");
  // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);


  // Uniforms
  timeLocation      = gl.getUniformLocation(program, "u_time" );
  viewportLocation  = gl.getUniformLocation(program, "u_viewport");

  // render is called inside this function//nope.
  resizeCanvas();
  render();

}

function render() {
    
  // Clear
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);


  // Pass uniforms
  nowtime = new Date().getTime();
  elapsedTime = (nowtime - startTime) / 1000;

  gl.uniform1f(timeLocation, elapsedTime);
  gl.uniform2fv(viewportLocation, viewportData);  

  // Draw
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  window.requestAnimationFrame(render, c);
}