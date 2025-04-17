/* eslint-env node */
import { DataAPIClient } from "@datastax/astra-db-ts";

export type ImageRecord = {
  _id?: string;
  username: string;
  image_url: string;
  created_at: string;
};

let astraClient: any = null;

export async function getAstraClient() {
  if (astraClient === null) {
    const endpoint = process.env.ASTRA_DB_ENDPOINT;
    const token = process.env.ASTRA_DB_APPLICATION_TOKEN;

    if (!endpoint || !token) {
      throw new Error("Missing required Astra DB configuration");
    }

    try {
      console.log("Connecting to Astra DB with endpoint:", endpoint);
      const client = new DataAPIClient(token);
      astraClient = client.db(endpoint);
      console.log("Successfully connected to Astra DB");
    } catch (error) {
      console.error("Failed to connect to Astra DB:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      throw error;
    }
  }
  return astraClient;
}

export async function getImagesCollection() {
  try {
    const client = await getAstraClient();
    console.log("Getting collection 'images'");
    const collection = client.collection("images");
    console.log("Successfully got images collection");
    return collection;
  } catch (error) {
    console.error("Failed to get images collection:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    throw error;
  }
} 