// Vercel Serverless Function for /api/orders
let inMemoryOrders: any[] = [];

export default function handler(req: any, res: any) {
  // Enable CORS for cross-domain mobile requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { code, phone } = req.query || {};
    if (code) {
      const match = inMemoryOrders.find(o => o.id && o.id.toLowerCase() === String(code).trim().toLowerCase());
      return res.status(200).json(match ? [match] : []);
    }
    if (phone) {
      const matches = inMemoryOrders.filter(o => o.customerPhone && o.customerPhone.includes(String(phone).trim()));
      return res.status(200).json(matches);
    }
    return res.status(200).json(inMemoryOrders);
  }

  if (req.method === 'POST') {
    const newOrder = req.body;
    if (newOrder && newOrder.id) {
      const idx = inMemoryOrders.findIndex(o => o.id === newOrder.id);
      if (idx >= 0) {
        inMemoryOrders[idx] = { ...inMemoryOrders[idx], ...newOrder };
      } else {
        inMemoryOrders.unshift(newOrder);
      }
      return res.status(200).json({ success: true, order: newOrder });
    }
    return res.status(400).json({ error: 'Invalid order data' });
  }

  if (req.method === 'PUT') {
    const { id, status, paymentStatus } = req.body || {};
    if (id) {
      const order = inMemoryOrders.find(o => o.id === id);
      if (order) {
        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        return res.status(200).json({ success: true, order });
      }
    }
    return res.status(400).json({ error: 'Order not found' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
