// Vercel Serverless Function for /api/orders
let inMemoryOrders: any[] = [];

export default function handler(req: any, res: any) {
  // Enable CORS for cross-domain mobile requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { code, phone } = req.query || {};
    if (code) {
      const match = inMemoryOrders.find(o => o && o.id && o.id.toLowerCase() === String(code).trim().toLowerCase());
      return res.status(200).json(match ? [match] : []);
    }
    if (phone) {
      const matches = inMemoryOrders.filter(o => o && o.customerPhone && o.customerPhone.includes(String(phone).trim()));
      return res.status(200).json(matches);
    }
    return res.status(200).json(inMemoryOrders);
  }

  if (req.method === 'POST') {
    const newOrder = req.body;
    if (newOrder && newOrder.id) {
      // Prevent duplicate by transaction ID
      if (newOrder.bankakTransactionId && String(newOrder.bankakTransactionId).trim()) {
        const cleanTrx = String(newOrder.bankakTransactionId).trim().toLowerCase();
        const duplicate = inMemoryOrders.find(o => 
          o && o.id && o.id.toLowerCase() !== String(newOrder.id).toLowerCase() &&
          o.bankakTransactionId &&
          String(o.bankakTransactionId).trim().toLowerCase() === cleanTrx
        );
        if (duplicate) {
          return res.status(400).json({
            error: `⚠️ إشعار تحويل مكرر: رقم العملية (${newOrder.bankakTransactionId}) مستخدم بالفعل في طلب سابق (${duplicate.id}).`
          });
        }
      }

      const idx = inMemoryOrders.findIndex(o => o && o.id === newOrder.id);
      if (idx >= 0) {
        inMemoryOrders[idx] = { ...inMemoryOrders[idx], ...newOrder };
      } else {
        inMemoryOrders.unshift(newOrder);
      }
      return res.status(200).json({ success: true, order: newOrder });
    }
    return res.status(400).json({ error: 'بيانات الطلب غير صالحة' });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { id, status, paymentStatus } = req.body || {};
    if (id) {
      const order = inMemoryOrders.find(o => o && o.id === id);
      if (order) {
        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        return res.status(200).json({ success: true, order });
      }
    }
    return res.status(400).json({ error: 'الطلب غير موجود' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (id) {
      inMemoryOrders = inMemoryOrders.filter(o => o && o.id !== id);
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: 'معرف الطلب مطلوب' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
