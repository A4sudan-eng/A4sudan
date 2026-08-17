// Vercel Serverless Function for /api/pricing
import { DEFAULT_PRICING_RATES } from '../src/data/initialData';

let inMemoryRates = { ...DEFAULT_PRICING_RATES };

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(inMemoryRates);
  }

  if (req.method === 'PUT') {
    const updated = req.body || {};
    inMemoryRates = { ...inMemoryRates, ...updated };
    return res.status(200).json({ success: true, rates: inMemoryRates });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
