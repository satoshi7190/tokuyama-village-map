import './style.css'; // CSSファイルのimport

// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useGsiTerrainSource } from 'maplibre-gl-gsi-terrain';

const gsiTerrainSource = useGsiTerrainSource(maplibregl.addProtocol);

import { customProtocol } from './protocol';

const protocolName = 'custom';
const protocol = customProtocol(protocolName);
maplibregl.addProtocol(protocolName, protocol.request);

// 地図の表示
const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
            terrain: gsiTerrainSource,
            seamlessphoto: {
                type: 'raster',
                tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],

                tileSize: 256,
                maxzoom: 18,
                attribution: "<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>", // 地図上に表示される属性テキスト
            },
            custom: {
                type: 'raster',
                tiles: ['custom://https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf'],
                tileSize: 256,
                minzoom: 4,
                maxzoom: 17,
                bounds: [136.290838, 35.635082, 136.537666, 35.795209],
            },
        },
        layers: [
            {
                id: 'seamlessphoto_layer',
                source: 'seamlessphoto',
                type: 'raster',
                layout: {
                    visibility: 'visible',
                },
                paint: {
                    'raster-opacity': 1.0, // 画像の透過度
                    'raster-brightness-max': [
                        // 画像の明るさ
                        'step',
                        ['zoom'],
                        0.9,
                        12.5,
                        0.7,
                    ],
                    'raster-saturation': -0.2, // 画像の彩度
                },
            },
        ],
    },
    center: [136.485452, 35.69576],
    zoom: 13,
    minZoom: 8.5,
    attributionControl: false,
    maxBounds: [135.636349, 34.892866, 138.273067, 36.754462], // 地図の表示範囲
    // hash: true, // URLに状態を保存 debug
});

// debug
// map._showTileBoundaries = true;

map.addControl(new maplibregl.NavigationControl()); // ナビゲーションコントロールを追加
map.addControl(
    new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true,
        },
        trackUserLocation: true,
    }),
);

map.on('load', () => {
    map.setPaintProperty('custom_layer', 'raster-opacity', [
        'interpolate',
        ['linear'],
        ['zoom'],
        11,
        0.0, // ズームレベル 8 の時に不透明度 0.3
        14,
        0.5, // ズームレベル 14 の時に不透明度 1.0
    ]);
});

map.on('click', 'text_layer2', () => {
    const coordinates = [136.482061383995216, 35.695368028023836];
    map.easeTo({
        duration: 1000,
        center: coordinates as [number, number],
        zoom: 14,
    });
});

// 透過度
const opacitySlider = document.getElementById('opacity') as HTMLInputElement;
opacitySlider.addEventListener('input', (e: Event) => {
    const target = e.target as HTMLInputElement;
    const opacity = parseFloat(target.value);

    map.setPaintProperty('custom_layer', 'raster-opacity', [
        'interpolate',
        ['linear'],
        ['zoom'],
        11,
        0.0, // ズームレベル 8 の時に不透明度 0.3
        14,
        opacity, // ズームレベル 14 の時に不透明度 1.0
    ]);

    const opacity2 = (parseFloat(target.value) * 100).toFixed(0);

    // 値を0〜100%形式で表示
    const opacityValue = document.getElementById('opacity-value') as HTMLElement;
    opacityValue.innerText = `${opacity2}%`;
});

const tileUrl = {
    seamlessphoto: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/13/7201/3225.jpg',
    pale: 'https://cyberjapandata.gsi.go.jp/xyz/pale/13/7201/3225.png',
};

type TileUrlkey = keyof typeof tileUrl;

let isBasemap: TileUrlkey = 'seamlessphoto';

const basemapButton = document.getElementById('basemap-select') as HTMLButtonElement;
basemapButton.style.background = 'url(' + tileUrl[isBasemap] + ') no-repeat center center / cover';

// 地図の切り替え
basemapButton.addEventListener('click', () => {
    isBasemap = isBasemap === 'seamlessphoto' ? 'pale' : 'seamlessphoto';
    map.setLayoutProperty('seamlessphoto_layer', 'visibility', isBasemap === 'seamlessphoto' ? 'visible' : 'none');
    map.setLayoutProperty('pale_layer', 'visibility', isBasemap === 'pale' ? 'visible' : 'none');
    map.setLayoutProperty('hillshade_layer', 'visibility', isBasemap === 'pale' ? 'visible' : 'none');
    const url = tileUrl[isBasemap];

    basemapButton.style.background = 'url(' + url + ') no-repeat center center / cover';
});
