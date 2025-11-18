import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

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
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
`;

  const fsSource = `
	#version 330 core
	
	// Author:
	// Title:
	
	#ifdef GL_ES
	precision mediump float;
	#endif
	
	uniform vec2 u_resolution;
	uniform vec2 u_mouse;
	uniform float u_time;
	uniform float fade;
	
	vec3 bcol = vec3(1.0, 2.0, 3.0);
	
	//[[0.072 0.131 0.531] [0.009 0.840 0.177] [0.252 0.541 0.462] [3.268 2.475 1.847]]
	//[[0.588 1.028 0.938] [0.068 0.908 0.128] [1.678 0.036 1.287] [5.047 0.626 0.351]]
	
	vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d){    
	    return a + b*cos( 6.283185*(c*t+d) );
	}
	
	float ndot(vec2 a, vec2 b ) { return a.x*b.x - a.y*b.y; }
	float sdRhombus( in vec2 p, in vec2 b ){
	    p = abs(p);
	    float h = clamp( ndot(b-2.0*p,b)/dot(b,b), -1.0, 1.0 );
	    float d = length( p-0.5*b*vec2(1.0-h,1.0+h) );
	    return d * sign( p.x*b.y + p.y*b.x - b.x*b.y );
	}
	
	void main() {
	    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy) / u_resolution.y;
		vec2 uv0 = uv;
	    vec2 uv1 = uv;
	    uv.x += 0.5;
	    uv0.x -= 0.5;
		vec3 finalColor = vec3(0.0);
	    
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
	    
	    float d3 = sdRhombus(uv1, vec2(1., .5));
	    
	    vec3 rcol1 = vec3(0.072, 0.131, 0.531);
	    vec3 gcol1 = vec3(0.009, 0.840, 0.177);
	    vec3 bcol1 = vec3(0.252, 0.541, 0.462);
	    vec3 alcol1 = vec3(3.268, 2.475, 1.847);
	    
	    vec3 rcol2 = vec3(0.588, 1.028, 0.938)*sin(u_time*.1);
	    vec3 gcol2 = vec3(0.068, 0.908, 0.128);
	    vec3 bcol2 = vec3(1.678, 0.036, 1.287);
	    vec3 alcol2 = vec3(5.047, 0.626, 0.351);
	    
	    vec3 col1 = palette(d1, rcol1, gcol1, bcol1, alcol1);
	    vec3 col2 = palette(d3, rcol2, gcol2, bcol2, alcol2);
	    
	    uv.xy += vec2(-1.0,0.0);
	    uv0.xy += vec2(1.0,0.0);
	    
	    float a1 = atan(uv0.y, uv0.x)+u_time*.04;
	    float a2 = atan(uv.y, uv.x)-u_time*.04;
	
	    float r1 = smoothstep(-0.5,1., cos(a1*10.))*0.2+0.4;
	    float r2 = smoothstep(-.5,1.0, cos(a2*10.))*-0.2+0.6;
	
	    vec3 g1 = vec3(1.-smoothstep(r1,r1+0.02,d1));
	    vec3 g2 = vec3(1.-smoothstep(r2,r2+0.02,d2));
	    vec3 rh1 = vec3(d3);
	    
	    finalColor += g1 * col1 * -uv.y;
	    finalColor += g2 * col1 * uv0.y;
	    
	    finalColor += d3 * col2;
	
	    gl_FragColor = vec4(finalColor*fade,1.0);
	}
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  // Draw the scene
  drawScene(gl, programInfo, buffers);
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
