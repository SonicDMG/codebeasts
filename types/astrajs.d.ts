declare module 'astrajs' {
  export interface AstraClientOptions {
    apiEndpoint: string;
    applicationToken: string;
  }

  export class AstraClient {
    constructor(options: AstraClientOptions);
    namespace(namespace: string): any;
    collection(collection: string): any;
  }
} 