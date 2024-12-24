import './style.css'; // CSSファイルのimport

// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
            seamlessphoto: {
                type: 'raster',
                tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],

                tileSize: 256,
                maxzoom: 18,
                attribution: "<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>", // 地図上に表示される属性テキスト
            },
            pale: {
                type: 'raster',
                tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
                tileSize: 256,
                maxzoom: 18,
                attribution: "<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>",
            },
            custom: {
                type: 'raster',
                tiles: ['custom://https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf'],
                tileSize: 256,
                minzoom: 4,
                maxzoom: 17,
                bounds: [136.290838, 35.635082, 136.537666, 35.795209],
            },
            gsi_v: {
                type: 'vector',
                tiles: ['https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf'],
                minzoom: 4,
                maxzoom: 13,
                bounds: [136.290838, 35.635082, 136.537666, 35.795209],
            },
            text: {
                type: 'geojson',
                data: './poi.geojson',
            },
            text2: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            properties: {
                                name: '徳山村',
                            },
                            geometry: {
                                type: 'Point',
                                coordinates: [136.41663, 35.72004],
                            },
                        },
                    ],
                },
            },
            tokuyama: {
                type: 'geojson',
                data: './tokuyama.geojson',
            },
            gifu: {
                type: 'geojson',
                data: './gifu.geojson',
            },
        },
        layers: [
            {
                id: 'seamlessphoto_layer', // レイヤーのID
                source: 'seamlessphoto', // ソースのID
                type: 'raster', // データタイプはラスターを指定
                // maxzoom: 14, // 最大ズームレベル
                layout: {
                    visibility: 'visible',
                },
                paint: {
                    'raster-opacity': 1.0, // 画像の透過度
                    'raster-brightness-max': [
                        'step',
                        ['zoom'],
                        0.9, // デフォルトの値: ズームレベルが12未満の場合
                        12.5,
                        0.7, // ズームレベル 12 での不透明度
                        // ズームレベル 14 での不透明度
                    ], // 画像の明るさの最大値
                    'raster-saturation': -0.2, // 画像の彩度
                    // 'raster-saturation': -1.0, // 画像の彩度
                },
            },
            {
                id: 'pale_layer', // レイヤーのID
                source: 'pale', // ソースのID
                type: 'raster', // データタイプはラスターを指定
                // maxzoom: 14, // 最大ズームレベル
                layout: {
                    visibility: 'none',
                },
                paint: {
                    'raster-opacity': 1.0, // 画像の透過度
                    'raster-brightness-max': 1.0, // 画像の明るさの最大値
                    'raster-saturation': -1.0, // 画像の彩度
                    // 'raster-saturation': -1.0, // 画像の彩度
                },
            },
            {
                id: 'custom_layer',
                source: 'custom',
                type: 'raster',
                maxzoom: 24,

                paint: {
                    // 'raster-opacity': 1.0,
                    'raster-opacity': 0,
                    'raster-brightness-max': 1.0, // 画像の明るさの最大値
                    'raster-brightness-min': 0.0, // 画像の明るさの最小値
                    'raster-saturation': -0.3, // 画像の彩度
                    // 'raster-hue-rotate': 45, // 画像の色相の回転角度
                },
            },

            // {
            //     'id': 'gsi_v_layer',
            //     'source': 'gsi_v',
            //     'source-layer': 'waterarea',
            //     'type': 'line',
            //     'minzoom': 10,
            //     'paint': {
            //         'line-color': '#00a2ff',
            //         'line-width': 1.5,
            //         'line-blur': 1,
            //     },
            // },

            {
                id: 'tokuyama_layer',
                source: 'tokuyama',
                type: 'line',
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 2,
                },
            },
            {
                id: 'gifu_layer',
                source: 'gifu',
                type: 'line',
                maxzoom: 10,
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 2,
                },
            },
            {
                id: 'text_layer',
                source: 'text',
                type: 'symbol',
                minzoom: 10,
                layout: {
                    'text-field': ['get', 'name'],
                    'text-size': 14,
                },
                paint: {
                    'text-color': '#000000',
                    'text-halo-width': 3,
                    'text-halo-color': '#ffffff',
                },
            },
            {
                id: 'text_layer2',
                source: 'text2',
                type: 'symbol',
                maxzoom: 10,
                layout: {
                    'text-field': ['get', 'name'],
                    'text-size': 16,
                    // 'text-anchor': 'bottom',
                },
                paint: {
                    'text-color': '#000000',
                    'text-halo-width': 3,
                    'text-halo-color': '#ffffff',
                },
            },
        ],
    },
    center: [136.485452, 35.69576], // 地図の中心座標
    zoom: 13, // 地図の初期ズームレベル
    minZoom: 8.5,
    // hash: true, // URLに状態を保存
    attributionControl: false,
    maxBounds: [135.636349, 34.892866, 138.273067, 36.754462], // 地図の表示範囲
});

// map._showTileBoundaries = true;

map.addControl(new maplibregl.NavigationControl()); // ナビゲーションコントロールを追加

map.on('load', () => {
    map.setPaintProperty('custom_layer', 'raster-opacity', [
        'interpolate',
        ['linear'],
        ['zoom'],
        11,
        0.0, // ズームレベル 8 の時に不透明度 0.3
        14,
        0.6, // ズームレベル 14 の時に不透明度 1.0
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
});

const tileUrl = {
    seamlessphoto: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/13/7201/3225.jpg',
    pale: 'https://cyberjapandata.gsi.go.jp/xyz/pale/13/7201/3225.png',
};

type TileUrlkey = keyof typeof tileUrl;

let isBasemap: TileUrlkey = 'seamlessphoto';

const basemapButton = document.getElementById('basemap-select') as HTMLButtonElement;
basemapButton.style.background = 'url(' + tileUrl[isBasemap] + ') no-repeat center center';

basemapButton.addEventListener('click', () => {
    isBasemap = isBasemap === 'seamlessphoto' ? 'pale' : 'seamlessphoto';
    map.setLayoutProperty('seamlessphoto_layer', 'visibility', isBasemap === 'seamlessphoto' ? 'visible' : 'none');
    map.setLayoutProperty('pale_layer', 'visibility', isBasemap === 'pale' ? 'visible' : 'none');
    const url = tileUrl[isBasemap];

    basemapButton.style.background = 'url(' + url + ') no-repeat center center / cover';
});
