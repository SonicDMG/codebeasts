declare module '@astrajs/collections' {
  export function createClient(config: {
    baseUrl: string;
    applicationToken: string;
  }): Promise<any>;
}

declare module '@astrajs/rest' {
  export function createClient(config: {
    baseUrl: string;
    applicationToken: string;
  }): Promise<any>;
} 