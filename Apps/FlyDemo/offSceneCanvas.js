let gl;
let u_Sampler;
function initWebgl() {
  const canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl");
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(
    vertexShader,
    `
               attribute vec4 a_Position;
               attribute vec2 a_TexCoord;
               varying vec2 v_TexCoord;
               void main() {
                 gl_Position = a_Position;
                 v_TexCoord = a_TexCoord;
               }
             `
  );
  gl.shaderSource(
    fragmentShader,
    `
               precision highp float;
               varying vec2 v_TexCoord;
               uniform sampler2D u_Sampler;
               void main() {
                 gl_FragColor = texture2D(u_Sampler,v_TexCoord);
               }
             `
  );
  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const data = new Float32Array([-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0]);
  const textureData = new Float32Array([0, 1, 0, 0, 1, 1, 1, 0]);

  const buffer = gl.createBuffer();
  const a_Position = gl.getAttribLocation(program, "a_Position");
  const a_TexCoord = gl.getAttribLocation(program, "a_TexCoord");
  u_Sampler = gl.getUniformLocation(program, "u_Sampler");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  const textureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, textureData, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_TexCoord);

  const texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
}

// --------------- 创建webgl渲染器 -----------------------------

// 更新webgl的画面
function updateWebGLTexture(reflectionImageData) {
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    reflectionImageData // 离屏画面
  );
  gl.uniform1i(u_Sampler, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
