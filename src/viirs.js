function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);

    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }

    return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
    var program = gl.createProgram();

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }

    var wrapper = {program: program};

    var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < numAttributes; i++) {
        var attribute = gl.getActiveAttrib(program, i);
        wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name);
    }
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i$1 = 0; i$1 < numUniforms; i$1++) {
        var uniform = gl.getActiveUniform(program, i$1);
        wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name);
    }

    return wrapper;
}

function createTexture(gl, filter, data, width, height) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    if (data instanceof Uint8Array) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

function bindTexture(gl, texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
}

function createBuffer(gl, data) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}

function bindAttribute(gl, program, attribute, size, type, normalized, stride, pointer) {
    var attributeLoc = gl.getAttribLocation(program, attribute);
    gl.enableVertexAttribArray(attributeLoc);
    gl.vertexAttribPointer(attributeLoc, size, type, normalized, stride, pointer);
}

function bindFramebuffer(gl, framebuffer, texture) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    if (texture) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    }
}

var pointVertexShader = "" +
"attribute vec4 a_coord;\n" +
"attribute float a_epoch;\n" +
"uniform mat4 u_map_matrix;\n" +
"uniform float u_point_size;\n" +
"uniform float u_min_epoch;\n" +
"uniform float u_max_epoch;\n" +
"void main() {\n" +
"  if (a_epoch < u_min_epoch || a_epoch > u_max_epoch){\n" + 
"    gl_Position = vec4(-1,-1,-1,-1);\n" +
"  } else {\n" + 
"    gl_Position = u_map_matrix * a_coord;\n" +
"  } \n" + 
"  gl_PointSize = u_point_size;\n" +
"}";

var pointFragmentShader = "" +
"#extension GL_OES_standard_derivatives : enable\n" +
"precision mediump float;\n" +
"void main() {\n" +
"  // set pixels in points to something that stands out\n" +
"  float dist = distance(gl_PointCoord.xy, vec2(0.5, 0.5));\n" +
"  float delta = fwidth(dist);\n" +
"  float alpha = smoothstep(0.45-delta, 0.45, dist);\n" +
"  gl_FragColor = vec4(.82, .22, .07, 1.) * (1. - alpha);\n" +
"}";


var Viirs = function Viirs(gl) {
    this.gl = gl;
    this.program = createProgram(gl, pointVertexShader, pointFragmentShader);

    this.numAttributes = 3; 
    this.buffer = {
            'count': 0,
            'buffer': null,
            'ready': false            
    }
}

Viirs.prototype.getBin = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open('get', url, true);
    xhr.onload = function () {
      var float32Array = new Float32Array(this.response);
      callback(float32Array);
    };
    xhr.send();
}


Viirs.prototype.setBuffer = function setBuffer(data) {
    this.buffer.count = data.length / this.numAttributes;
    this.buffer.buffer = createBuffer(gl, data);   
    this.buffer.ready = true;
}

Viirs.prototype.draw = function draw(transform, options) {
    if (this.buffer.ready) {
        var options = options || {};
        var pointSize = options.pointSize || 10.;
        var minEpoch = options.minEpoch || new Date('1971-01-01').getTime()/1000.;
        var maxEpoch = options.maxEpoch || new Date('2020-01-01').getTime()/1000.;
        var gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE );
        var program = this.program;
        var buffer = this.buffer;
        gl.useProgram(program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
        bindAttribute(gl, program.program, 'a_coord', 2, gl.FLOAT, false, 12, 0);    
        bindAttribute(gl, program.program, 'a_epoch', 1, gl.FLOAT, false, 12, 8);    
        gl.uniformMatrix4fv(program.u_map_matrix, false, transform);
        gl.uniform1f(program.u_point_size, pointSize);
        gl.uniform1f(program.u_min_epoch, minEpoch);
        gl.uniform1f(program.u_max_epoch, maxEpoch);

        gl.drawArrays(gl.POINTS, 0, buffer.count);
        gl.disable(gl.BLEND);
    }
};


