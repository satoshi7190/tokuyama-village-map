#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec4 u_color;
uniform sampler2D u_image1;
uniform sampler2D u_image2;
uniform int u_isPolygon;

in vec2 v_texCoord;
out vec4 outColor;

void main() {
    // Y座標を反転
    vec2 flippedTexCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
    
    outColor = texture(u_image2, flippedTexCoord);
}