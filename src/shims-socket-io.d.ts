// Temporary shim so the project lints before installing socket.io-client types
// Remove this file after installing real dependency.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare module 'socket.io-client' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const io: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Socket = any;
}


