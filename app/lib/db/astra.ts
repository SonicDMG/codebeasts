/* eslint-env node */
import { DataAPIClient } from "@datastax/astra-db-ts";

// Types
export type ImageRecord = {
  _id?: string;
  username: string;
  image_url: string;
  created_at: string;
};

export type UserDetailsRecord = {
  _id?: string;
  session_id: string;
  username: string;
  languages: string;
  prompt: string;
  githubUrl: string;
  repoCount?: number;
  animalSelection?: any[][];
};

// Database client singleton
let astraClient: any = null;

async function getAstraClient() {
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
      throw error;
    }
  }
  return astraClient;
}

// Collection getters
async function getImagesCollection() {
  const client = await getAstraClient();
  return client.collection("images");
}

async function getUserDetailsCollection() {
  const client = await getAstraClient();
  return client.collection("github_user_details");
}

// Image operations
export async function getAllImages() {
  try {
    console.log("getAllImages - Fetching images collection");
    const collection = await getImagesCollection();
    
    console.log("getAllImages - Finding all records");
    const records = await collection.find().toArray();
    console.log(`getAllImages - Found ${records.length} records`);
    
    return records;
  } catch (error) {
    console.error("getAllImages - Error:", error);
    throw error;
  }
}

export async function getImageByUsername(username: string) {
  try {
    const normalizedUsername = username.toLowerCase();
    console.log(`getImageByUsername - Finding image for ${normalizedUsername}`);
    
    const collection = await getImagesCollection();
    const records = await collection.find({ username: normalizedUsername }).toArray();
    console.log(`getImageByUsername - Found ${records.length} records`);

    if (!records.length) {
      return null;
    }

    // Return the most recent image if multiple exist
    return records[0];
  } catch (error) {
    console.error("getImageByUsername - Error:", error);
    throw error;
  }
}

export async function upsertImage(imageData: Omit<ImageRecord, '_id'>) {
  try {
    const normalizedUsername = imageData.username.toLowerCase();
    console.log(`upsertImage - Processing image for ${normalizedUsername}`);

    const collection = await getImagesCollection();
    
    // Find existing record
    const existingRecord = await collection.findOne({ username: normalizedUsername });
    
    const imageRecord = {
      ...imageData,
      username: normalizedUsername
    };

    let result;
    if (existingRecord) {
      // Update existing record
      console.log(`upsertImage - Updating existing record: ${existingRecord._id}`);
      result = await collection.updateOne(
        { _id: existingRecord._id },
        { $set: imageRecord }
      );
    } else {
      // Insert new record
      console.log("upsertImage - Creating new record");
      result = await collection.insertOne(imageRecord);
    }

    console.log("upsertImage - Operation result:", result);
    return result;
  } catch (error) {
    console.error("upsertImage - Error:", error);
    throw error;
  }
}

// User details operations - Reverted to parse body_blob
export async function getUserDetails(username: string): Promise<UserDetailsRecord | null> {
  console.log(`DB Service: Fetching user details for username: ${username}`);
  const normalizedUsername = username.toLowerCase();
  try {
    const userDetailsCollection = await getUserDetailsCollection();
    
    // Find the document based on session_id, only fetch necessary fields
    const record = await userDetailsCollection.findOne(
      { session_id: normalizedUsername }, 
      { projection: { _id: 1, session_id: 1, body_blob: 1 } } // Fetch blob and ids
    );

    console.log(`DB Service: Found record (using session_id):`, record);

    if (record?.body_blob) {
      try {
        const bodyBlob = JSON.parse(record.body_blob);
        console.log(`DB Service: Parsed body_blob:`, bodyBlob);

        // Assuming structure is { type: 'ai', data: { content: 'lang|prompt|url|repoCount|animalSelectionJson' } } 
        if (bodyBlob.type === 'ai' && bodyBlob.data?.content) {
          const content = bodyBlob.data.content;
          console.log(`DB Service: Full content string from blob: [${content}]`);

          // Split, ensuring we get at least 5 empty strings if parts are missing
          const parts = content.split('|').map((field: string) => field.trim());
          const rawLanguages = parts[0] || '';
          const prompt = parts[1] || '';
          const rawGithubUrl = parts[2] || ''; // Define rawGithubUrl here
          const rawRepoCount = parts[3] || ''; 
          const rawAnimalSelection = parts[4] || '';
          
          // --- ADD LOGS --- 
          console.log(`DB Service: Raw repoCount string from split: [${rawRepoCount}]`);
          console.log(`DB Service: Raw animalSelection string from split: [${rawAnimalSelection}]`);
          // --- END LOGS --- 
          
          // Parse repoCount - Strip label first
          const repoCountString = rawRepoCount.replace(/^num_repositories:\s*/, ''); // Remove label
          const count = parseInt(repoCountString, 10);
          const repoCount = !isNaN(count) ? count : undefined; 
          
          // Parse animalSelection - Strip label first
          let animalSelection: any[][] | undefined = undefined;
          const animalSelectionJsonString = rawAnimalSelection.replace(/^animal_selection:\s*/, ''); // Remove label
          try {
            if (animalSelectionJsonString) {
              // Replace single quotes with double quotes before parsing
              const validJsonString = animalSelectionJsonString.replace(/'/g, '"');
              animalSelection = JSON.parse(validJsonString);
            }
          } catch (jsonParseError) {
            console.error(`DB Service: Error parsing animalSelection JSON from content for ${normalizedUsername}:`, jsonParseError);
            // Keep animalSelection as undefined if parsing fails
          }

          // Clean languages and githubUrl 
          // Revert: Just strip label, frontend handles filtering placeholders
          const cleanedLanguages = rawLanguages.replace(/^languages:\s*/, '').trim(); 
          // Remove the conditional check and associated logs
          // console.log(`DB Service: Checking cleanedLanguages: [${cleanedLanguages}]`); 
          // if (cleanedLanguages === '[]' || cleanedLanguages.startsWith('[None') || cleanedLanguages === "[['None']]") {
          //   console.log(`DB Service: Condition met! Setting cleanedLanguages to empty string.`); 
          //   cleanedLanguages = '';
          // }
          // console.log(`DB Service: Final cleaned languages string: [${cleanedLanguages}]`); 
          const cleanedGithubUrl = rawGithubUrl.replace(/^github_user_name_url:\s*/, '');

          const userDetails: UserDetailsRecord = {
            _id: record._id,
            session_id: record.session_id,
            username: record.session_id, // Use session_id as the username field for return consistency
            languages: cleanedLanguages, // Send potentially raw cleaned string (e.g., "[]", "['None']")
            prompt,
            githubUrl: cleanedGithubUrl, // Use cleaned value
            repoCount, 
            animalSelection,
          };
          console.log(`DB Service: FINAL userDetails object being returned:`, userDetails);
          return userDetails;
        } else {
          console.warn(`DB Service: body_blob found but content format unexpected for ${normalizedUsername}`);
        }
      } catch (parseError) {
        console.error(`DB Service: Error parsing body_blob for ${normalizedUsername}:`, parseError);
      }
    }
    
    console.log(`DB Service: No valid user details found or parsed for ${normalizedUsername}`);
    return null;
  } catch (error) {
    console.error("DB Service: Error fetching user details:", error);
    return null;
  }
}

// Export the client getter for advanced use cases
export { getAstraClient }; 