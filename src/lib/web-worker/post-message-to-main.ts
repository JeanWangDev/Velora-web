import { TextBinaryConverter } from "./text-binary-converter";
import type { IMessagePayload } from "./message-payload";

export function postMessageToMain(message: IMessagePayload) {
  self.postMessage(TextBinaryConverter.encode(message));
}
