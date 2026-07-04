import EventEmitter from "eventemitter3";
import { isClient } from "./env";
import type { IMessagePayload } from "./message-payload";
import { TextBinaryConverter } from "./text-binary-converter";
import { WORKER_EVENT } from "./worker-event";

export class BaseWorker extends EventEmitter {
  private worker?: Worker;
  private pendingCallbackMap = new Map<number, VoidFunction>();
  private id = 0;

  constructor() {
    super();

    if (isClient) {
      this.worker = new Worker(new URL("./worker-script.ts", import.meta.url), {
        type: "module",
      });

      this.worker.onmessage = this.onmessage.bind(this);
      this.worker.onerror = this.onerror.bind(this);
    }
  }

  public postMessage(payload: IMessagePayload, callback?: VoidFunction) {
    const nextId = this.nextId();

    if (callback) {
      this.pendingCallbackMap.set(nextId, callback);
    }

    const buffer = TextBinaryConverter.encode({ ...payload, id: nextId });
    this.worker?.postMessage(buffer);
  }

  private onmessage(event: MessageEvent<Uint8Array>) {
    const data = TextBinaryConverter.decode(event.data) as IMessagePayload;
    const { id } = data;

    if (id && this.pendingCallbackMap.has(id)) {
      this.pendingCallbackMap.get(id)!();
      this.pendingCallbackMap.delete(id);
    }

    this.emit(WORKER_EVENT, data);
  }

  private onerror(event: ErrorEvent) {
    console.error("[web-worker] worker error", event);
  }

  private nextId() {
    return ++this.id;
  }

  public terminateWorker() {
    this.worker?.terminate();
    this.worker = undefined;
    this.pendingCallbackMap.clear();
    this.removeAllListeners();
  }
}
