#version 300 es
precision highp float;

uniform vec4 u_color;
uniform sampler2D u_image;
uniform int u_isPolygon;

in vec2 v_texCoord;
out vec4 outColor;

void main() {
    // Y座標を反転
    vec2 flippedTexCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
    
    outColor = texture(u_image, flippedTexCoord);
}