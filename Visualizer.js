
//Run application
function main() {
    initWebAudio();
    initCanvas();
    initShaders();
    initGeometry();
    loadTexture();

    //enable mouse handling.
   document.getElementById("glCanvas").onmousedown = handleMouseDown;
   document.onmouseup = handleMouseUp;
   document.onmousemove = handleMouseMove;

    gl.clearColor(0.4,0.4,0.4,1.0);
    gl.enable(gl.DEPTH_TEST);

    animate();
}

function reloadWebAudio() {
	audio.close();
    initWebAudio();
}

///////////////////
// Web audio setup
//////////////////
var audio;
var analyser;
var bufferLength;
var spectrumData;
var waveformData;
var fileName;
function initWebAudio() {	
    audio = new AudioContext();
    analyser = audio.createAnalyser();
    analyser.fftSize = 2048;
    bufferLength = analyser.frequencyBinCount;
    spectrumData = new Uint8Array(bufferLength);
    waveformData = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(spectrumData);
    analyser.getByteTimeDomainData(waveformData);
    var request = new XMLHttpRequest();

    //Load mp3 here..
    request.open('GET', (document.getElementById("fileName").value), true);
    request.responseType = 'arraybuffer';
    request.onload = function () {
        var undecodedAudio = request.response;
        audio.decodeAudioData(undecodedAudio, function (buffer) {
            var sourceBuffer = audio.createBufferSource();
            sourceBuffer.buffer = buffer;
            sourceBuffer.connect(analyser);
            analyser.connect(audio.destination);
            sourceBuffer.start(audio.currentTime);
        });
    };
    request.send();
}


///////////////
// WebGL Setup
//////////////
var gl;
function initCanvas() {
    gl = null;
    var canvas = document.getElementById("glCanvas");
    try {
        // Try to grab the standard context. If it fails, fallback to experimental.
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch(e) {}

    // If we don't have a GL context, give up now
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        gl = null;
    }
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    return gl;
}


//////////////////////
// Shader Setup
/////////////////////
var shaderProgram;
function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);


    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

///////////////////
// Geometry Setup
//////////////////
var gridVertexPositionBuffer;
var gridVertexTextureCoordBuffer;
var gridVertexIndexBuffer;
function initGeometry() {
    var xPoints = 100;
    var zPoints = 100;

		var vertexPosition = [];
    var textureCoords = [];

		for (var i = 0; i < xPoints; i++) {
		    var xCoord = 2 * (i/xPoints) - 1;
				for (var j = 0; j < zPoints; j++) {
				 		var zCoord = 2 * (j/zPoints) - 1;
						vertexPosition.push(xCoord);
            vertexPosition.push(0);
						//vertexPosition.push(Math.random() * (1.0 - (-1.0)) + -1.0);
						vertexPosition.push(zCoord);

            textureCoords.push(i/xPoints);
						textureCoords.push(j/xPoints);
				}
		}

    var vertexIndices = [];
		for (var i = 0; i < xPoints - 1; i++) {
				for (var j = 0; j < zPoints - 1; j++) {
						//coords for first triangle
						var leftCorner = (i * zPoints) + j;
						var rightCorner = (i * zPoints) + j + zPoints;
						var topRight = rightCorner + 1;

						//first triangle
						vertexIndices.push(leftCorner);
						vertexIndices.push(rightCorner);
						vertexIndices.push(topRight);

						//second triangle
						vertexIndices.push(topRight);
						vertexIndices.push(leftCorner + 1);
						vertexIndices.push(leftCorner);
				}
		}

    gridVertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, gridVertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);
		gridVertexPositionBuffer.itemSize = 3;
		gridVertexPositionBuffer.numItems = vertexPosition.length / 3;

    gridVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    gridVertexTextureCoordBuffer.itemSize = 2;
    gridVertexTextureCoordBuffer.numItems = textureCoords.length / 2;

    gridVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gridVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
    gridVertexIndexBuffer.itemSize = 1;
    gridVertexIndexBuffer.numItems = vertexIndices.length;
}

/////////////////////////
//  Texture Setup
////////////////////////
var texture;
function loadTexture() {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}

function audioToTexture(audioData, textureArray, scale) {
    for (let i = 0; i < audioData.length; i++) {
        textureArray[4 * i + 0] = audioData[4 * i + 0] // R
        textureArray[4 * i + 1] = audioData[4 * i + 1] // G
        textureArray[4 * i + 2] = audioData[4 * i + 2] // B
        textureArray[4 * i + 3] = 255;				   // A
    }
    var square = Math.sqrt(audioData.length);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, (textureArray.length * scale)/square, square * scale, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureArray)
}

/////////////////////////
// Drawing and Animation
/////////////////////////
function draw() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);

    var zoom = document.getElementById("slider");
    var scale = document.getElementById("slider2");
    mat4.translate(mvMatrix, [0.0, 0.0, zoom.value]);

    mat4.multiply(mvMatrix, textureRotationMatrix);
    gl.bindBuffer(gl.ARRAY_BUFFER, gridVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, gridVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    var spectrumArray = new Uint8Array(spectrumData.length)
    audioToTexture(spectrumData, spectrumArray, scale.value);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gridVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, gridVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

//Continually update the scene to animate the draw() call.
function animate() {
    requestAnimationFrame(animate);
    analyser.getByteFrequencyData(spectrumData);
    analyser.getByteTimeDomainData(waveformData);
    draw();
}

//////////////////
// Helper functions
/////////////////
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

//////////////////
// Mouse Handling
/////////////////
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var textureRotationMatrix = mat4.create();
mat4.identity(textureRotationMatrix);

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = newX - lastMouseX;
    var newRotationMatrix = mat4.create();
    mat4.identity(newRotationMatrix);
    mat4.rotate(newRotationMatrix, degToRad(deltaX / 5), [0, 1, 0]);

    var deltaY = newY - lastMouseY;
    mat4.rotate(newRotationMatrix, degToRad(deltaY / 5), [1, 0, 0]);

    mat4.multiply(newRotationMatrix, textureRotationMatrix, textureRotationMatrix);

    lastMouseX = newX
    lastMouseY = newY;
}

function clickedFlatCheckbox() {		
	document.getElementById("gouraud").checked = !document.getElementById("flatShading").checked;
}
	

