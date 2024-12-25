// ベクトルタイルの読み込み
const loadVector = async (src: string, signal: AbortSignal): Promise<ArrayBuffer> => {
    const response = await fetch(src, { signal: signal });
    if (!response.ok) {
        throw new Error('Failed to fetch pbf');
    }
    return await response.arrayBuffer();
};

// 画像の読み込み
const loadImage = async (src: string, signal: AbortSignal): Promise<ImageBitmap> => {
    const response = await fetch(src, { signal: signal });
    if (!response.ok) {
        throw new Error('Failed to fetch image');
    }
    return await createImageBitmap(await response.blob());
};

export class WorkerProtocol {
    private worker: Worker;
    private pendingRequests: Map<
        string,
        {
            resolve: (value: { data: Uint8Array } | PromiseLike<{ data: Uint8Array }>) => void;
            reject: (reason?: any) => void;
            controller: AbortController;
        }
    >;

    constructor(worker: Worker) {
        this.worker = worker;
        this.pendingRequests = new Map();
        this.worker.addEventListener('message', this.handleMessage);
        this.worker.addEventListener('error', this.handleError);
    }

    async request(url: string, controller: AbortController): Promise<{ data: Uint8Array }> {
        try {
            const regex = /(\d+)\/(\d+)\/(\d+)\.pbf/;
            const match = url.match(regex);

            if (!match) return Promise.reject(new Error('Invalid URL'));
            const z: number = parseInt(match[1], 10);
            const x: number = parseInt(match[2], 10);
            const y: number = parseInt(match[3], 10);

            // 年代別空中写真のURL
            const imageUrl = `https://cyberjapandata.gsi.go.jp/xyz/gazo1/${z}/${x}/${y}.jpg`;

            // ラスタータイルとベクトルタイルのロード
            const [tile, image] = await Promise.all([
                loadVector(url, controller.signal), // タイルデータのロード
                loadImage(imageUrl, controller.signal), // 画像データのロード
            ]);

            return new Promise((resolve, reject) => {
                this.pendingRequests.set(url, { resolve, reject, controller });

                this.worker.postMessage({
                    tile,
                    url,
                    image,
                });
            });
        } catch (error) {
            return Promise.reject(error);
        }
    }

    private handleMessage = (e: MessageEvent) => {
        const { id, buffer, error } = e.data;
        if (error) {
            console.error(`Error processing tile ${id}:`, error);
        } else {
            const request = this.pendingRequests.get(id);
            if (request) {
                request.resolve({ data: new Uint8Array(buffer) });
                this.pendingRequests.delete(id);
            }
        }
    };

    // // 全てのリクエストをキャンセルするメソッド
    // cancelAllRequests() {
    //     this.pendingRequests.forEach(({ reject, controller }) => {
    //         controller.abort();
    //         reject(new Error('Request cancelled'));
    //     });
    //     this.pendingRequests.clear();
    // }

    private handleError = (e: ErrorEvent) => {
        console.error('Worker error:', e);
        this.pendingRequests.forEach((request) => {
            request.reject(new Error('Worker error occurred'));
        });
        this.pendingRequests.clear();
    };
}

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
const workerProtocol = new WorkerProtocol(worker);

export const customProtocol = (protocolName: string) => {
    return {
        request: (params: { url: string }, abortController: AbortController) => {
            const imageUrl = params.url.replace(`${protocolName}://`, '');

            return workerProtocol.request(imageUrl, abortController);
        },
        // cancelAllRequests: () => workerProtocol.cancelAllRequests(),
    };
};
