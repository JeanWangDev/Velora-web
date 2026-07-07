import { TextBinaryConverter } from "./text-binary-converter";

type IWebSocketWorkerMessageHeartbeat = {
  type: "heartbeat";
  name: string;
  message: string;
  interval: number;
};

type IWebSocketWorkerMessageClearHeartbeat = {
  type: "clearHeartbeat";
  name: string;
};

type IWebSocketWorkerMessage =
  | IWebSocketWorkerMessageHeartbeat
  | IWebSocketWorkerMessageClearHeartbeat;

const intervalIdMap = new Map<string, ReturnType<typeof setInterval>>();

const handleHeartbeat = (eventData: IWebSocketWorkerMessageHeartbeat) => {
  const { name, interval } = eventData;
  const prev = intervalIdMap.get(name);
  if (prev !== undefined) {
    clearInterval(prev);
  }

  const intervalId = setInterval(() => {
    self.postMessage(
      TextBinaryConverter.encode({
        type: "heartbeat",
        name,
      }),
    );
  }, interval);
  intervalIdMap.set(name, intervalId);
};

const handleClearHeartbeat = (eventData: IWebSocketWorkerMessageClearHeartbeat) => {
  const { name } = eventData;
  const id = intervalIdMap.get(name);
  if (id !== undefined) {
    clearInterval(id);
    intervalIdMap.delete(name);
  }
};

self.onmessage = function (event: MessageEvent<Uint8Array>) {
  const eventData = TextBinaryConverter.decode(event.data) as IWebSocketWorkerMessage;

  switch (eventData.type) {
    case "heartbeat":
      handleHeartbeat(eventData as IWebSocketWorkerMessageHeartbeat);
      break;
    case "clearHeartbeat":
      handleClearHeartbeat(eventData as IWebSocketWorkerMessageClearHeartbeat);
      break;
  }
};
