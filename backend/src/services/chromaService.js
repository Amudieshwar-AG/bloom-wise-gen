const { ChromaClient } = require('chromadb');

let chromaOptions = { host: 'localhost', port: 8000, ssl: false };
const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
try {
  const url = new URL(chromaUrl);
  chromaOptions = {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80),
    ssl: url.protocol === 'https:'
  };
} catch (e) {
  console.warn('Invalid CHROMA_URL, falling back to localhost:8000');
}
const client = new ChromaClient(chromaOptions);

const storeChunks = async (collectionName, chunks) => {
  try {
    const collection = await client.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: { generate: () => [] },
    });
    
    const ids = chunks.map(c => c.chunk_id);
    const documents = chunks.map(c => c.content);
    const embeddings = chunks.map(c => c.embedding);
    
    await collection.add({
      ids: ids,
      embeddings: embeddings,
      documents: documents,
      metadatas: chunks.map(c => ({ source: collectionName })),
    });
    
    return true;
  } catch (error) {
    console.error('Error storing chunks in Chroma:', error);
    throw new Error('Failed to store chunks in Vector DB.');
  }
};

const querySimilarChunks = async (collectionName, queryEmbedding, topK = 10) => {
  try {
    const collection = await client.getCollection({
      name: collectionName,
      embeddingFunction: { generate: () => [] },
    });
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
    });
    
    if (!results || !results.documents || !results.documents[0]) {
       return [];
    }
    
    const similarChunks = [];
    for (let i = 0; i < results.documents[0].length; i++) {
       similarChunks.push({
         chunk_id: results.ids[0][i],
         content: results.documents[0][i],
         score: results.distances ? results.distances[0][i] : null
       });
    }
    
    return similarChunks;
  } catch (error) {
    console.error('Error querying Chroma:', error);
    throw new Error('Failed to retrieve chunks from Vector DB.');
  }
};

const deleteCollection = async (collectionName) => {
  try {
    await client.deleteCollection({ name: collectionName });
  } catch (e) {
    console.warn(`Could not delete collection ${collectionName}:`, e.message);
  }
};

module.exports = {
  storeChunks,
  querySimilarChunks,
  deleteCollection,
};
