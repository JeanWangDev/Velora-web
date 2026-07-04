import type { WorkerMessageChannelEnum } from "./worker-message-channel";

export interface IMessagePayload<T = unknown> {
  channel: WorkerMessageChannelEnum;
  payload?: T;
  id?: number;
}
