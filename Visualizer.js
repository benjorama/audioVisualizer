//Run application
function main() {
  initWebAudio();
  initCanvas();
  animate();
}


// Initialize web Audio context, load an mp3, and setup analyser.
var audio;
var analyser;
var bufferLength;
var dataArray;
var fileName;
function initWebAudio() {
  audio = new AudioContext();
  analyser = audio.createAnalyser();
  analyser.fftSize = 2048;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Float32Array(bufferLength);
  analyser.getFloatTimeDomainData(dataArray);
  var request = new XMLHttpRequest();

  //Load mp3 here..
  //request.open('GET', 'BoxCat_Games_-_05_-_Battle_Boss.mp3', true);
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


//Setup 2D canvas (later we will change this to a webGL canvas.)
var scopeCanvas;
var scopeContext;
function initCanvas() {
  scopeCanvas = document.getElementById('glCanvas')
  scopeCanvas.width = dataArray.length
  scopeCanvas.height = 200
  scopeContext = scopeCanvas.getContext('2d');
}


//Draw function that simulates an oscilloscope.
//source: https://noisehack.com/build-music-visualizer-web-audio-api/
function drawOscilloscope() {
  scopeContext.clearRect(0, 0, scopeCanvas.width, scopeCanvas.height)
  scopeContext.beginPath()
  for (let i = 0; i < dataArray.length; i++) {
    const x = i
    const y = (0.5 + dataArray[i] / 2) * scopeCanvas.height;
    if (i == 0) {
      scopeContext.moveTo(x, y)
    } else {
      scopeContext.lineTo(x, y)
    }
  }
  scopeContext.stroke()
}

//Continually update the scene to animate the drawOscilloscope call.
function animate() {
  requestAnimationFrame(animate);
  analyser.getFloatTimeDomainData(dataArray);
  drawOscilloscope();
}
