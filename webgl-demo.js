import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

let deltaTime = 0;

main();

//
// start here
//
function main() {
  const canvas = document.querySelector("#glcanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;

    void main(void) {
      gl_Position = aVertexPosition;
    }
  `;

  // Fragment shader program

  const fsSource = `
    // Author:
    // Title:

    #ifdef GL_ES
    precision mediump float;
    #endif

    uniform vec2 uAspect;
    uniform float uTime;

    vec3 bcol = vec3(1.0, 2.0, 3.0);

    //[[0.072 0.131 0.531] [0.009 0.840 0.177] [0.252 0.541 0.462] [3.268 2.475 1.847]]

    vec3 palette( in float t ){
        vec3 a = vec3(0.072, 0.131, 0.531);
        vec3 b = vec3(0.009, 0.840, 0.177);
        vec3 c = vec3(0.252, 0.541, 0.462);
        vec3 d = vec3(3.268, 2.475, 1.847);
        
        return a + b*cos( 6.283185*(c*t+d) );
    }

    float sdSegment( in vec2 p, in vec2 a, in vec2 b ){
        vec2 pa = p-a, ba = b-a;
        float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
        return length( pa - ba*h );
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy * 2. - uAspect.xy) / uAspect.y;
      vec2 uv0 = uv;
      vec2 uv1 = uv;
      vec2 uv2 = uv;
      uv.x += 0.5;
      uv0.x -= 0.5;
      vec3 finalColor = vec3(0.0);
        
      vec2 pos1 = vec2(-1., 0.);
      vec2 pos2 = vec2(1., 0.);
      float s1 = sdSegment(uv2, fract(pos1), fract(pos2));
        
      float c1 = length(uv);
      c1 = sin(c1*4.888)/6.;
      c1 = abs(c1);
        
      float c2 = length(uv0);
      c2 = sin(c2*4.888)/6.;
      c2 = abs(c2);
        
      float d1 = length(uv*2.0) - 0.5;
      d1 = abs(d1);
        
      float d2 = length(uv0*2.0) - 0.5;
      d2 = abs(d2);
        
      vec3 col = palette(d1);
        
      vec3 lcol = vec3(3., 2., 1.);
      lcol.y*=pow(uTime,8.);
        
      uv.xy += vec2(-1.0,0.0);
      uv0.xy += vec2(1.0,0.0);
        
      float a1 = atan(uv0.y, uv0.x)+uTime*.04;
      float a2 = atan(uv.y, uv.x)-uTime*.04;

      float r1 = smoothstep(-0.5,1., cos(a1*10.))*0.2+0.4;
      float r2 = smoothstep(-.5,1.0, cos(a2*10.))*-0.2+0.6;

      vec3 g1 = vec3(1.-smoothstep(r1,r1+0.02,d1));
      vec3 g2 = vec3(1.-smoothstep(r2,r2+0.02,d2));
      vec3 l1 = vec3(s1);
        
      finalColor += g1 * col * -uv.y;
      finalColor += g2 * col * uv0.y;
      //finalColor += l1 / lcol;

      gl_FragColor = vec4(finalColor,1.0);
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVertexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    },
    uniformLocations: {
      aspectVector: gl.getUniformLocation(shaderProgram, "uAspect"),
      deltaTime: gl.getUniformLocation(shaderProgram, "uTime"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  //let then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}