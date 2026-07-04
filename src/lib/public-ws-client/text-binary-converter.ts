export class TextBinaryConverter {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  public static encode(payload: unknown) {
    return this.encoder.encode(JSON.stringify(payload));
  }

  public static decode(payload: AllowSharedBufferSource) {
    return JSON.parse(this.decoder.decode(payload));
  }
}
