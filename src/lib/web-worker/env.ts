export const isClient = typeof window !== "undefined";
export const isSSR = !isClient;
