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
	uniform vec2 u_resolution;
	uniform vec2 u_mouse;
	uniform float u_time;
	
	float ndot(vec2 a, vec2 b ) { return a.x*b.x - a.y*b.y; }
	float sdRhombus( in vec2 p, in vec2 b ) 
	{
	    p = abs(p);
	    float h = clamp( ndot(b-2.0*p,b)/dot(b,b), -1.0, 1.0 );
	    float d = length( p-0.5*b*vec2(1.0-h,1.0+h) );
	    return d * sign( p.x*b.y + p.y*b.x - b.x*b.y );
	}
	
	float sdUnevenCapsule( vec2 p, float r1, float r2, float h )
	{
	    p.x = abs(p.x);
	    float b = (r1-r2)/h;
	    float a = sqrt(1.0-b*b);
	    float k = dot(p,vec2(-b,a));
	    if( k < 0.0 ) return length(p) - r1;
	    if( k > a*h ) return length(p-vec2(0.0,h)) - r2;
	    return dot(p, vec2(a,b) ) - r1;
	}
	
	vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
	{
	    return a + b*cos( 6.283185*(c*t+d) );
	}
	
	//[[0.500 0.500 0.500] [0.500 0.500 0.500] [0.800 0.800 0.500] [0.000 0.200 0.500]]
	//[[0.000 0.500 0.500] [0.000 0.500 0.500] [0.000 0.333 0.500] [0.000 0.667 0.500]]
	
	void main() {
	    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy) /u_resolution.y;
	    vec2 uv0 = uv;
	    vec2 uv1 = uv;
		vec3 color;
	    float box;
	    float circle;
	    float capsule;
	    
	    for (float i = 0.0; i < 3.0; i++){
	        uv = fract(uv * 1.216) - 0.484;
	        uv1 = fract(uv1 * 1.504 * sin(u_time*5.)) - 0.300;
	        
	        vec2 l = vec2(0.270,-0.270);
	        vec2 d = abs(uv)-l;
	        vec2 d1 = abs(uv1)-l;
	
	        vec3 a = vec3(0.0, 0.5, 0.5);
	        vec3 b = vec3(0.0, 0.5, 0.5);
	        vec3 c = vec3(0.0, 0.333, 0.5);
	        vec3 d2 = vec3(0.0, 0.667, 0.5);
	        
	        d = 0.01 / d;
	
	        box = sdRhombus(d, l);
	        capsule = sdUnevenCapsule(d1, 0.5, 0.5, 1.0);
	        color = palette(length(uv0)+u_time, a, b, c, d2)*abs((sin(u_time)));
	    }
	
	    gl_FragColor = vec4(color*box*capsule,1.0);
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
