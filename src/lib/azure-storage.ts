import { 
  BlobServiceClient, 
  generateBlobSASQueryParameters, 
  BlobSASPermissions, 
  StorageSharedKeyCredential 
} from '@azure/storage-blob';

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'audio-files';

if (!AZURE_STORAGE_CONNECTION_STRING) {
  console.warn('AZURE_STORAGE_CONNECTION_STRING is not set');
}

let blobServiceClient: BlobServiceClient | null = null;

function getBlobServiceClient() {
  if (!blobServiceClient && AZURE_STORAGE_CONNECTION_STRING) {
    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  }
  return blobServiceClient;
}

function getAccountDetails(connectionString: string) {
  const matchName = connectionString.match(/AccountName=([^;]+)/);
  const matchKey = connectionString.match(/AccountKey=([^;]+)/);
  if (!matchName || !matchKey) throw new Error('Invalid Connection String');
  return { name: matchName[1], key: matchKey[1] };
}

export async function uploadAudioFile(
  audioData: ArrayBuffer | Buffer, 
  fileName: string, 
  contentType: string = 'audio/mpeg'
): Promise<string> {
  const client = getBlobServiceClient();
  if (!client || !AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error('Azure Storage not configured');
  }

  const containerClient = client.getContainerClient(CONTAINER_NAME);
  
  // Ensure container exists (private access is fine)
  await containerClient.createIfNotExists();

  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  
  await blockBlobClient.uploadData(audioData, {
    blobHTTPHeaders: {
      blobContentType: contentType
    }
  });

  // Generate SAS Token (valid for 10 years)
  // This allows read access even with private container
  const { name, key } = getAccountDetails(AZURE_STORAGE_CONNECTION_STRING);
  const sharedKeyCredential = new StorageSharedKeyCredential(name, key);
  
  const startsOn = new Date();
  const expiresOn = new Date(startsOn.valueOf() + 315360000000); // 10 years
  
  const sasToken = generateBlobSASQueryParameters({
    containerName: CONTAINER_NAME,
    blobName: fileName,
    permissions: BlobSASPermissions.parse("r"), // Read only
    startsOn,
    expiresOn
  }, sharedKeyCredential).toString();

  return `${blockBlobClient.url}?${sasToken}`;
}

export async function deleteAudioFile(fileName: string): Promise<void> {
  const client = getBlobServiceClient();
  if (!client) {
    throw new Error('Azure Storage not configured');
  }

  const containerClient = client.getContainerClient(CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  
  await blockBlobClient.deleteIfExists();
}

export async function deleteAudioFilesByPrefix(prefix: string): Promise<{ deletedCount: number; errorCount: number }> {
  const client = getBlobServiceClient();
  if (!client) {
    throw new Error('Azure Storage not configured');
  }

  const containerClient = client.getContainerClient(CONTAINER_NAME);

  let deletedCount = 0;
  let errorCount = 0;

  for await (const blob of containerClient.listBlobsFlat({ prefix })) {
    try {
      await containerClient.deleteBlob(blob.name);
      deletedCount++;
    } catch {
      errorCount++;
    }
  }

  return { deletedCount, errorCount };
}
