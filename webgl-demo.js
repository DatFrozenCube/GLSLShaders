import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

let squareRotation = 0.0;
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
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;

  // Fragment shader program

  const fsSource = `
    precision mediump float;

    uniform vec2 uAspect;
    uniform float uTime;

    vec3 bcol = vec3(1.0, 2.0, 3.0);

    //[[0.558 0.608 0.968] [0.398 0.188 0.098] [0.748 -1.702 -2.092] [0.378 -1.742 -4.045]]

    vec3 palette( in float t ){
        vec3 a = vec3(0.558, 0.608, 0.968);
        vec3 b = vec3(0.398, 0.188, 0.098);
        vec3 c = vec3(0.748, -1.702, -2.092);
        vec3 d = vec3(0.378, -1.742, -4.045);
        
        return a + b*cos( 6.283185*(c*t+d) );
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy * 2. - uAspect.xy) / uAspect.y;
      uv.x += 0.5;
      vec2 uv0 = uv;
      vec3 finalColor = vec3(0.0);
        
      float c1 = length(uv);
      c1 = sin(c1*4.888)/6.;
      c1 = abs(c1);
        
      float d = length(uv*2.0) - 0.5;
      d = abs(d);
      
      vec3 col = vec3(-1.);
      vec3 g;

      float a = atan(uv.x, uv.y)+uTime*-0.04;

      float r = smoothstep(-.5,1., cos(a*10.))*0.2+0.5;

      g = vec3(1.-smoothstep(r,r+0.02,d));        
      
      finalColor += g * col * uv.y;
      
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
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      aspectVector: gl.getUniformLocation(shaderProgram, "uAspect"),
      deltaTime: gl.getUniformLocation(shaderProgram, "uTime"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  let then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, squareRotation, deltaTime);
    squareRotation += deltaTime;

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