import { getListings } from '../../data/repliers';

export default async function handler(req, res) {
  try {
    const { query } = req;
    const listings = await getListings(query);
    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}