import type { IMessagePayload } from "./message-payload";
import { WorkerMessageChannelEnum } from "./worker-message-channel";
import { Logger } from "./logger";
import { TextBinaryConverter } from "./text-binary-converter";
import marketKlinesHandler from "./handlers/market-klines-handler";

const fnMap: Record<
  WorkerMessageChannelEnum,
  (message: IMessagePayload) => void | Promise<void>
> = {
  [WorkerMessageChannelEnum.MARKET_KLINES]: marketKlinesHandler,
};

self.onmessage = function (event: MessageEvent<Uint8Array>) {
  const data = TextBinaryConverter.decode(event.data) as IMessagePayload;
  const { channel, payload } = data;

  const fn = fnMap[channel];

  if (fn) {
    void fn(data);
    return;
  }

  Logger.warn(
    `worker-script 没有找到对应的 handler, channel: ${channel}, payload: ${JSON.stringify(payload)}`,
  );
};
