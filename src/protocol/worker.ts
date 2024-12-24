import fsSource from './shader/fragment.glsl?raw';
import vsSource from './shader/vertex.glsl?raw';

import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

import earcut from 'earcut';

const decodePBF = (arrayBuffer: ArrayBuffer) => {
    const pbf = new Pbf(arrayBuffer);
    return new VectorTile(pbf);
};

let gl: WebGL2RenderingContext | null = null;
let program: WebGLProgram | null = null;
let positionBuffer: WebGLBuffer | null = null;
let texture: WebGLTexture | null = null;

const initWebGL = (canvas: OffscreenCanvas) => {
    gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL not supported');
    }

    const loadShader = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null => {
        const shader = gl.createShader(type);
        if (!shader) {
            console.error('Unable to create shader');
            return null;
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) {
        throw new Error('Failed to load shaders');
    }

    program = gl.createProgram();
    if (!program) {
        throw new Error('Failed to create program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        throw new Error('Failed to link program');
    }

    gl.useProgram(program);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // テクスチャ関連の設定を追加
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
};

const canvas = new OffscreenCanvas(256, 256);

self.onmessage = async (e) => {
    const { url, tile, image } = e.data;

    const vectorTile = decodePBF(tile);

    // 湖沼データのレイヤーを取得
    const layer = vectorTile.layers['waterarea'];

    try {
        if (!gl) {
            texture = initWebGL(canvas);
        }

        if (!gl || !program || !positionBuffer) {
            throw new Error('WebGL initialization failed');
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (layer) {
            for (let i = 0; i < layer.length; i++) {
                const feature = layer.feature(i);
                const geometry = feature.loadGeometry();

                for (const ring of geometry) {
                    // ポリゴンの場合は三角形に変換して描画
                    if (feature.type === 3) {
                        const flatCoords = ring.flatMap(({ x, y }) => [x, y]);
                        const triangles = earcut(flatCoords);
                        const trianglePositions = triangles.flatMap((index: number) => [(flatCoords[index * 2] / layer.extent) * 2 - 1, 1 - (flatCoords[index * 2 + 1] / layer.extent) * 2]);

                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trianglePositions), gl.STATIC_DRAW);
                        gl.drawArrays(gl.TRIANGLES, 0, trianglePositions.length / 2);
                    }

                    // ポイント、ラインは今回は無視
                }
            }
        }

        const blob = await canvas.convertToBlob();
        if (!blob) {
            throw new Error('Failed to convert canvas to blob');
        }
        const buffer = await blob.arrayBuffer();
        self.postMessage({ id: url, buffer });
    } catch (error) {
        if (error instanceof Error) {
            self.postMessage({ id: url, error: error.message });
        }
    }
};
