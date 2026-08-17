// Vercel Serverless Function for /api/verify-receipt
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, paymentMethod } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'لم يتم توفير صورة الإشعار' });
    }

    let mimeType = 'image/jpeg';
    let base64Data = imageBase64;
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        isValid: false,
        hasTransactionId: false,
        hasRecipientName: false,
        status: 'مرفوض',
        message: 'تعذر التحقق الآلي من الإشعار: مفتاح الذكاء الاصطناعي غير متوفر في بيئة Vercel. يرجى ضبط GEMINI_API_KEY في Environment Variables.'
      });
    }

    const promptText = `أنت مدقق مالي وخبير فحص إشعارات التحويل البنكي الصارم جداً لمكتبة "A4 Sudan" للطباعة بالسودان.
المطلوب منك فحص صورة الإشعار المرفقة بدقة بالغة (تطبيقات: بنكك Bankak من بنك الخرطوم، أو أوكاش O-Cash، أو فوري Fawry من بنك فيصل، أو إشعار تحويل مصرفي) وتطبيق الشروط الصارمة التالية:

الشرط الأول (صارم وإلزامي 100%):
اسم المستفيد / المحول إليه أو صاحب الحساب المستقبل للتحويل:
يجب أن يكون حصراً: "محمد عثمان حاج شرفي" أو "محمد عثمان حاج شرفي عثمان" أو بالإنجليزية "mohamed osman hajsharfi osman" أو "Mohamed Osman Haj Sharfi" أو "Hajsharfi" أو "محمد عثمان".
- إذا كانت الصورة لا تحتوي بوضوح تام على اسم المستفيد "محمد عثمان حاج شرفي" (أو كان التحويل لشخص آخر، أو صورة عامة، أو مستند مختلف)، يجب رفض الإشعار قطعياً (hasRecipientName: false, isValid: false).

الشرط الثاني (إلزامي):
يجب أن يحتوي الإشعار على "رقم العملية" أو "رقم المرجع" أو "رقم الإشعار" (Transaction ID / Reference Number / Ref No). استخرج رقم العملية بدقة دون نصوص إضافية (hasTransactionId: true أو false).

قواعد اتخاذ القرار:
- الإشعار يكون مقبولاً (isValid: true, status: "مقبول") فقط وفقط إذا كان إشعار تحويل مالي صحيح + اسم المستفيد هو محمد عثمان حاج شرفي + يوجد رقم عملية واضح.
- إذا لم يتوفر اسم "محمد عثمان حاج شرفي" أو كان التحويل لشخص آخر: الإشعار مرفوض تماماً (isValid: false, status: "مرفوض").
- إذا كانت الصورة غير واضحة أو ليست إشعاراً بنكياً: الإشعار مرفوض تماماً (isValid: false, status: "مرفوض").

أجب بتنسيق JSON حصراً بدون أي نصوص أو markdown:
{
  "isValid": true,
  "hasTransactionId": true,
  "transactionId": "رقم العملية المستخرج بدقة",
  "hasRecipientName": true,
  "recipientName": "اسم المستفيد كما هو مكتوب في الإشعار",
  "amount": "المبلغ المحول إن وجد",
  "bankName": "اسم التطبيق أو البنك",
  "transferDate": "تاريخ وتوقيت التحويل إن وجد",
  "status": "مقبول",
  "message": "سبب القبول أو سبب الرفض باللغة العربية"
}`;

    const aiInstance = new GoogleGenAI({ apiKey });
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.1,
      }
    });

    const responseText = response.text || '';
    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsedResult: any = null;
    try {
      parsedResult = JSON.parse(cleanJson);
    } catch (e) {
      const lower = responseText.toLowerCase();
      const hasName = responseText.includes('محمد عثمان') || lower.includes('mohamed osman') || lower.includes('hajsharfi') || lower.includes('haj sharfi');
      const hasTrx = !lower.includes('لا يوجد رقم عملية') && !lower.includes('hastransactionid: false') && !lower.includes('hastransactionid": false');
      
      parsedResult = {
        isValid: hasName && hasTrx,
        hasTransactionId: hasTrx,
        hasRecipientName: hasName,
        recipientName: hasName ? 'محمد عثمان حاج شرفي عثمان' : '',
        transactionId: '',
        status: hasName && hasTrx ? 'مقبول' : 'مرفوض',
        message: hasName 
          ? 'تم فحص وقبول إشعار التحويل لحساب محمد عثمان حاج شرفي.'
          : 'الإشعار مرفوض ❌: لم يتم العثور على اسم المستفيد (محمد عثمان حاج شرفي) في الإشعار المرفق.'
      };
    }

    // STRICT VALIDATION OF RECIPIENT NAME
    const detectedRecipient = (parsedResult.recipientName || '').toLowerCase();
    const rawTextLower = (cleanJson + ' ' + responseText).toLowerCase();

    const hasValidOwnerName = 
      detectedRecipient.includes('محمد عثمان') ||
      detectedRecipient.includes('حاج شرفي') ||
      detectedRecipient.includes('hajsharfi') ||
      detectedRecipient.includes('haj sharfi') ||
      detectedRecipient.includes('mohamed osman') ||
      (parsedResult.hasRecipientName === true && (
        rawTextLower.includes('محمد عثمان') ||
        rawTextLower.includes('حاج شرفي') ||
        rawTextLower.includes('hajsharfi')
      ));

    if (!hasValidOwnerName || !parsedResult.hasRecipientName) {
      return res.json({
        isValid: false,
        isDuplicate: false,
        hasTransactionId: Boolean(parsedResult.hasTransactionId),
        transactionId: parsedResult.transactionId || '',
        hasRecipientName: false,
        recipientName: parsedResult.recipientName || '',
        status: 'مرفوض',
        message: 'الإشعار مرفوض ❌: لم يتم العثور على اسم المستفيد المعتمد (محمد عثمان حاج شرفي) في الإشعار المرفق. يجب أن يكون التحويل موجهاً حصراً لحساب صاحب المتجر.'
      });
    }

    const rawTrxId = (parsedResult.transactionId || '').trim();
    if (!rawTrxId || rawTrxId.length < 3 || rawTrxId.toLowerCase() === 'none' || rawTrxId.toLowerCase() === 'null') {
      return res.json({
        isValid: false,
        isDuplicate: false,
        hasTransactionId: false,
        transactionId: '',
        hasRecipientName: true,
        recipientName: 'محمد عثمان حاج شرفي عثمان',
        status: 'مرفوض',
        message: 'الإشعار مرفوض ❌: لم يتم العثور على رقم عملية أو رقم مرجعي صالح في صورة الإشعار. يرجى رفع صورة إشعار واضحة تحتوي على رقم العملية.'
      });
    }

    return res.json({
      isValid: true,
      isDuplicate: false,
      hasTransactionId: true,
      transactionId: rawTrxId,
      hasRecipientName: true,
      recipientName: 'محمد عثمان حاج شرفي عثمان',
      amount: parsedResult.amount || '',
      bankName: parsedResult.bankName || paymentMethod || 'بنكك',
      transferDate: parsedResult.transferDate || '',
      status: 'مقبول',
      message: `تم فحص وقبول إشعار التحويل بنجاح ✅ لحساب (محمد عثمان حاج شرفي) - رقم العملية: ${rawTrxId}`
    });

  } catch (error: any) {
    console.error('Vercel Receipt Verification Error:', error);
    return res.json({
      isValid: false,
      hasTransactionId: false,
      hasRecipientName: false,
      status: 'مرفوض',
      message: 'تعذر التحقق الآلي من الإشعار حالياً. يرجى التأكد من رفع صورة واضحة جداً لإشعار تحويل بنكي موجه إلى (محمد عثمان حاج شرفي) يحتوي على رقم العملية.'
    });
  }
}
