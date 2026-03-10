import { MongoClient, ObjectId } from 'mongodb'

const COLLECTION = 'artworks'

export interface Artwork {
  id: string
  userId: string
  title: string
  style: string
  imageUrl: string
  isPublic?: boolean
  likes: string[]
  comments: { userId: string; text: string }[]
  createdAt: string
}

interface ArtworkDoc extends Artwork {
  _id?: ObjectId
}

async function getCollection() {
  const config = useRuntimeConfig()
  const uri = config.mongoUri
  if (!uri) {
    throw new Error('MONGODB_URI not configured')
  }
  const client = new MongoClient(uri)
  const db = client.db()
  return { client, col: db.collection<ArtworkDoc>(COLLECTION) }
}

function docToArtwork(doc: ArtworkDoc): Artwork {
  const { _id, ...rest } = doc
  return rest
}

export async function getArtworks(): Promise<Artwork[]> {
  const { client, col } = await getCollection()
  try {
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray()
    return docs.map(docToArtwork)
  } finally {
    await client.close()
  }
}

export async function insertArtwork(artwork: Artwork): Promise<Artwork> {
  const { client, col } = await getCollection()
  try {
    const doc: ArtworkDoc = { ...artwork }
    await col.insertOne(doc)
    return artwork
  } finally {
    await client.close()
  }
}

export async function updateArtwork(
  id: string,
  update: { likes?: string[] }
): Promise<Artwork | null> {
  const { client, col } = await getCollection()
  try {
    const set: Partial<ArtworkDoc> = {}
    if (update.likes !== undefined) set.likes = update.likes
    const result = await col.findOneAndUpdate(
      { id },
      { $set: set },
      { returnDocument: 'after' }
    )
    return result ? docToArtwork(result) : null
  } finally {
    await client.close()
  }
}
