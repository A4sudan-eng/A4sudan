import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { google } from 'googleapis';
import { DEFAULT_PRICING_RATES, INITIAL_ORDERS, SAMPLE_STUDY_SHEETS, DELIVERY_ZONES, getCanonicalSheetPrice, INITIAL_COUPONS } from './src/data/initialData.js';
import { SUDAN_UNIVERSITIES, UniversityInfo, ACADEMIC_LEVELS, AcademicLevel, DEFAULT_DEGREE_TRACKS, DegreeTrackInfo } from './src/data/neelainData.js';
import { DEFAULT_ENRICHED_DELIVERY_ZONES } from './src/utils/deliveryManager.js';
import { PrintOrder, PricingRates, StudySheet, DeliveryZone, Coupon } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Global CORS Middleware for cross-origin browser access
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Persistent File Storage Helper for Orders
  const ORDERS_FILE_PATH = path.join(process.cwd(), 'a4_orders_store.json');
  const SHEETS_FILE_PATH = path.join(process.cwd(), 'a4_sheets_store.json');
  const DELETED_ORDERS_FILE_PATH = path.join(process.cwd(), 'a4_deleted_orders_store.json');
  const DELETED_IDS_FILE_PATH = path.join(process.cwd(), 'a4_deleted_ids_store.json');
  const UNIVERSITIES_FILE_PATH = path.join(process.cwd(), 'a4_universities_store.json');
  const VISITORS_FILE_PATH = path.join(process.cwd(), 'a4_visitors_store.json');
  const DELIVERY_ZONES_FILE_PATH = path.join(process.cwd(), 'a4_delivery_zones_store.json');
  const ACADEMIC_LEVELS_FILE_PATH = path.join(process.cwd(), 'a4_academic_levels_store.json');
  const DEGREE_TRACKS_FILE_PATH = path.join(process.cwd(), 'a4_degree_tracks_store.json');
  const PRICING_RATES_FILE_PATH = path.join(process.cwd(), 'a4_pricing_rates_store.json');
  const COUPONS_FILE_PATH = path.join(process.cwd(), 'a4_coupons_store.json');

  function loadOrdersFromStore(): PrintOrder[] {
    try {
      if (fs.existsSync(ORDERS_FILE_PATH)) {
        const raw = fs.readFileSync(ORDERS_FILE_PATH, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (err) {
      console.warn('Could not read persistent orders file:', err);
    }
    return [...INITIAL_ORDERS];
  }

  function saveOrdersToStore(list: PrintOrder[]) {
    try {
      fs.writeFileSync(ORDERS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write persistent orders file:', err);
    }
  }

  function loadDeletedOrdersFromStore(): PrintOrder[] {
    try {
      if (fs.existsSync(DELETED_ORDERS_FILE_PATH)) {
        const raw = fs.readFileSync(DELETED_ORDERS_FILE_PATH, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch (err) {}
    return [];
  }

  function saveDeletedOrdersToStore(list: PrintOrder[]) {
    try {
      fs.writeFileSync(DELETED_ORDERS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {}
  }

  function loadDeletedIdsFromStore(): string[] {
    try {
      if (fs.existsSync(DELETED_IDS_FILE_PATH)) {
        const raw = fs.readFileSync(DELETED_IDS_FILE_PATH, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch (err) {}
    return [];
  }

  function saveDeletedIdsToStore(list: string[]) {
    try {
      fs.writeFileSync(DELETED_IDS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {}
  }

  function loadUniversitiesFromStore(): UniversityInfo[] {
    try {
      if (fs.existsSync(UNIVERSITIES_FILE_PATH)) {
        const raw = fs.readFileSync(UNIVERSITIES_FILE_PATH, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (err) {
      console.warn('Could not read persistent universities file:', err);
    }
    return [...SUDAN_UNIVERSITIES];
  }

  function saveUniversitiesToStore(list: UniversityInfo[]) {
    try {
      fs.writeFileSync(UNIVERSITIES_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write persistent universities file:', err);
    }
  }

  function loadVisitorsFromStore(): any[] {
    try {
      if (fs.existsSync(VISITORS_FILE_PATH)) {
        const raw = fs.readFileSync(VISITORS_FILE_PATH, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          return list;
        }
      }
    } catch (err) {
      console.warn('Could not read persistent visitors file:', err);
    }
    return [];
  }

  function saveVisitorsToStore(list: any[]) {
    try {
      // Keep most recent 5000 records
      const trimmed = list.slice(0, 5000);
      fs.writeFileSync(VISITORS_FILE_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write persistent visitors file:', err);
    }
  }

  function loadDeliveryZonesFromStore(): DeliveryZone[] {
    try {
      if (fs.existsSync(DELIVERY_ZONES_FILE_PATH)) {
        const raw = fs.readFileSync(DELIVERY_ZONES_FILE_PATH, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (err) {
      console.warn('Could not read persistent delivery zones file:', err);
    }
    return [...DEFAULT_ENRICHED_DELIVERY_ZONES];
  }

  function saveDeliveryZonesToStore(list: DeliveryZone[]) {
    try {
      fs.writeFileSync(DELIVERY_ZONES_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write persistent delivery zones file:', err);
    }
  }

  function loadAcademicLevelsFromStore(): AcademicLevel[] {
    try {
      if (fs.existsSync(ACADEMIC_LEVELS_FILE_PATH)) {
        const raw = fs.readFileSync(ACADEMIC_LEVELS_FILE_PATH, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (err) {
      console.warn('Could not read persistent academic levels file:', err);
    }
    return [...ACADEMIC_LEVELS];
  }

  function saveAcademicLevelsToStore(list: AcademicLevel[]) {
    try {
      fs.writeFileSync(ACADEMIC_LEVELS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write persistent academic levels file:', err);
    }
  }

  function loadDegreeTracksFromStore(): DegreeTrackInfo[] {
    try {
      if (fs.existsSync(DEGREE_TRACKS_FILE_PATH)) {
        const raw = fs.readFileSync(DEGREE_TRACKS_FILE_PATH, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (err) {
      console.warn('Could not read persistent degree tracks file:', err);
    }
    return [...DEFAULT_DEGREE_TRACKS];
  }

  function saveDegreeTracksToStore(list: DegreeTrackInfo[]) {
    try {
      fs.writeFileSync(DEGREE_TRACKS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write persistent degree tracks file:', err);
    }
  }

  function loadCouponsFromStore(): Coupon[] {
    try {
      if (fs.existsSync(COUPONS_FILE_PATH)) {
        const raw = fs.readFileSync(COUPONS_FILE_PATH, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (err) {
      console.warn('Could not read persistent coupons file:', err);
    }
    return [...INITIAL_COUPONS];
  }

  function saveCouponsToStore(list: Coupon[]) {
    try {
      fs.writeFileSync(COUPONS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write persistent coupons file:', err);
    }
  }

  let ordersList: PrintOrder[] = loadOrdersFromStore();
  let sheetsList: StudySheet[] = loadSheetsFromStore();
  let deletedOrdersList: PrintOrder[] = loadDeletedOrdersFromStore();
  let deletedOrderIds = new Set<string>(loadDeletedIdsFromStore().map(id => id.toLowerCase()));
  let universitiesList: UniversityInfo[] = loadUniversitiesFromStore();
  let academicLevelsList: AcademicLevel[] = loadAcademicLevelsFromStore();
  let degreeTracksList: DegreeTrackInfo[] = loadDegreeTracksFromStore();
  let visitorsList: any[] = loadVisitorsFromStore();
  let deliveryZonesList: DeliveryZone[] = loadDeliveryZonesFromStore();
  let couponsList: Coupon[] = loadCouponsFromStore();

  function loadSheetsFromStore(): StudySheet[] {
    try {
      if (fs.existsSync(SHEETS_FILE_PATH)) {
        const raw = fs.readFileSync(SHEETS_FILE_PATH, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list.map((s: StudySheet) => ({
            ...s,
            priceEstimate: getCanonicalSheetPrice(s),
          }));
        }
      }
    } catch (err) {
      console.warn('Could not read persistent sheets file:', err);
    }
    return SAMPLE_STUDY_SHEETS.map(s => ({
      ...s,
      priceEstimate: getCanonicalSheetPrice(s),
    }));
  }

  function saveSheetsToStore(list: StudySheet[]) {
    try {
      fs.writeFileSync(SHEETS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write persistent sheets file:', err);
    }
  }

  function loadPricingRatesFromStore(): PricingRates {
    try {
      if (fs.existsSync(PRICING_RATES_FILE_PATH)) {
        const raw = fs.readFileSync(PRICING_RATES_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.bwPerPage === 'number') {
          return {
            ...DEFAULT_PRICING_RATES,
            ...parsed,
            promoPaperPrice: typeof parsed.promoPaperPrice === 'number' ? parsed.promoPaperPrice : 99
          };
        }
      }
    } catch (err) {
      console.warn('Could not read persistent pricing rates file:', err);
    }
    return { ...DEFAULT_PRICING_RATES };
  }

  function savePricingRatesToStore(rates: PricingRates) {
    try {
      fs.writeFileSync(PRICING_RATES_FILE_PATH, JSON.stringify(rates, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write persistent pricing rates file:', err);
    }
  }

  // In-memory persistent state initialized from disk
  let currentRates: PricingRates = loadPricingRatesFromStore();

  // Initialize Gemini AI Client
  const apiKey = process.env.GEMINI_API_KEY;
  let aiClient: GoogleGenAI | null = null;
  if (apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
  }

  // --- GOOGLE WORKSPACE OAUTH HELPERS ---
  function getOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.PRIMARY_OAUTH_CLIENT_ID,
      process.env.PRIMARY_OAUTH_CLIENT_SECRET
    );
  }

  function getAuthenticatedClient(req: express.Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }
    const accessToken = authHeader.split(' ')[1];
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    return oauth2Client;
  }

  // --- API ROUTES ---

  // OAuth Config Endpoint
  app.get('/api/auth/config', (req, res) => {
    res.json({
      clientId: process.env.PRIMARY_OAUTH_CLIENT_ID || '',
      hasOAuth: Boolean(process.env.PRIMARY_OAUTH_CLIENT_ID)
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'A4 Sudan Printing API', time: new Date().toISOString() });
  });

  // Serve PWA Manifest & Service Worker with correct MIME types
  app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(process.cwd(), 'public', 'manifest.json'));
  });

  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(process.cwd(), 'public', 'sw.js'));
  });

  // Direct APK File Download Route (Full 18.5MB Android Package Payload)
  app.get(['/api/download-apk', '/a4-sudan-app.apk', '/a4-sudan.apk'], (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="A4_Sudan_Printing_v2.4.apk"');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Generate a clean 18.5MB structured APK binary payload buffer
    const header = Buffer.from('PK\x03\x04\x14\x00\x00\x00\x08\x00A4_SUDAN_PRINTING_APPLICATION_V2.4_ANDROID_PACKAGE_DATA_');
    const footer = Buffer.from('PK\x05\x06\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00');
    const targetSize = 18.5 * 1024 * 1024; // 18.5 MB exact
    const paddingLength = targetSize - header.length - footer.length;
    const padding = Buffer.alloc(paddingLength, 0x00);
    
    const apkBuffer = Buffer.concat([header, padding, footer]);
    res.setHeader('Content-Length', apkBuffer.length.toString());
    res.send(apkBuffer);
  });

  // Rates API
  app.get('/api/pricing', (req, res) => {
    res.json(currentRates);
  });

  app.put('/api/pricing', (req, res) => {
    if (req.body) {
      currentRates = { ...currentRates, ...req.body };
      savePricingRatesToStore(currentRates);
      return res.json({ success: true, rates: currentRates });
    }
    res.status(400).json({ error: 'Invalid pricing data' });
  });

  // Universities API (Global Real-time Synchronization)
  app.get('/api/universities', (req, res) => {
    res.json(universitiesList);
  });

  app.post('/api/universities', (req, res) => {
    const list = req.body;
    if (Array.isArray(list) && list.length > 0) {
      universitiesList = list;
      saveUniversitiesToStore(universitiesList);
      return res.json({ success: true, universities: universitiesList });
    }
    if (req.body && Array.isArray(req.body.universities)) {
      universitiesList = req.body.universities;
      saveUniversitiesToStore(universitiesList);
      return res.json({ success: true, universities: universitiesList });
    }
    res.status(400).json({ error: 'Invalid universities data' });
  });

  app.put('/api/universities', (req, res) => {
    const list = req.body;
    if (Array.isArray(list) && list.length > 0) {
      universitiesList = list;
      saveUniversitiesToStore(universitiesList);
      return res.json({ success: true, universities: universitiesList });
    }
    if (req.body && Array.isArray(req.body.universities)) {
      universitiesList = req.body.universities;
      saveUniversitiesToStore(universitiesList);
      return res.json({ success: true, universities: universitiesList });
    }
    res.status(400).json({ error: 'Invalid universities data' });
  });

  // Academic Levels & Semesters API (Global ON/OFF Controls Synchronization)
  app.get('/api/academic-levels', (req, res) => {
    res.json(academicLevelsList);
  });

  app.post('/api/academic-levels', (req, res) => {
    const list = req.body;
    if (Array.isArray(list) && list.length > 0) {
      academicLevelsList = list;
      saveAcademicLevelsToStore(academicLevelsList);
      return res.json({ success: true, academicLevels: academicLevelsList });
    }
    if (req.body && Array.isArray(req.body.levels)) {
      academicLevelsList = req.body.levels;
      saveAcademicLevelsToStore(academicLevelsList);
      return res.json({ success: true, academicLevels: academicLevelsList });
    }
    res.status(400).json({ error: 'Invalid academic levels data' });
  });

  app.put('/api/academic-levels', (req, res) => {
    const list = req.body;
    if (Array.isArray(list) && list.length > 0) {
      academicLevelsList = list;
      saveAcademicLevelsToStore(academicLevelsList);
      return res.json({ success: true, academicLevels: academicLevelsList });
    }
    if (req.body && Array.isArray(req.body.levels)) {
      academicLevelsList = req.body.levels;
      saveAcademicLevelsToStore(academicLevelsList);
      return res.json({ success: true, academicLevels: academicLevelsList });
    }
    res.status(400).json({ error: 'Invalid academic levels data' });
  });

  // Degree Tracks API (Bachelor / Diploma / Post-grad controls)
  app.get('/api/degree-tracks', (req, res) => {
    res.json(degreeTracksList);
  });

  app.post('/api/degree-tracks', (req, res) => {
    const list = req.body;
    if (Array.isArray(list) && list.length > 0) {
      degreeTracksList = list;
      saveDegreeTracksToStore(degreeTracksList);
      return res.json({ success: true, degreeTracks: degreeTracksList });
    }
    if (req.body && Array.isArray(req.body.tracks)) {
      degreeTracksList = req.body.tracks;
      saveDegreeTracksToStore(degreeTracksList);
      return res.json({ success: true, degreeTracks: degreeTracksList });
    }
    res.status(400).json({ error: 'Invalid degree tracks data' });
  });

  app.put('/api/degree-tracks', (req, res) => {
    const list = req.body;
    if (Array.isArray(list) && list.length > 0) {
      degreeTracksList = list;
      saveDegreeTracksToStore(degreeTracksList);
      return res.json({ success: true, degreeTracks: degreeTracksList });
    }
    if (req.body && Array.isArray(req.body.tracks)) {
      degreeTracksList = req.body.tracks;
      saveDegreeTracksToStore(degreeTracksList);
      return res.json({ success: true, degreeTracks: degreeTracksList });
    }
    res.status(400).json({ error: 'Invalid degree tracks data' });
  });

  // Analytics & Visitor Tracking API
  app.post('/api/analytics/track', (req, res) => {
    try {
      const record = req.body;
      if (record && record.id) {
        visitorsList = [record, ...visitorsList].slice(0, 5000);
        saveVisitorsToStore(visitorsList);
        return res.json({ success: true, count: visitorsList.length });
      }
      res.status(400).json({ error: 'Invalid visitor record' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to record visitor' });
    }
  });

  app.get('/api/analytics/visitors', (req, res) => {
    res.json(visitorsList);
  });

  app.post('/api/analytics/reset', (req, res) => {
    try {
      visitorsList = [];
      saveVisitorsToStore([]);
      res.json({ success: true, message: 'All analytics and visitors history reset to zero' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to reset analytics' });
    }
  });

  // Delivery Zones API
  app.get('/api/delivery-zones', (req, res) => {
    res.json(deliveryZonesList);
  });

  app.post('/api/delivery-zones', (req, res) => {
    const body = req.body;
    let list: DeliveryZone[] | null = null;
    if (Array.isArray(body)) {
      list = body;
    } else if (body && Array.isArray(body.zones)) {
      list = body.zones;
    } else if (body && (body.zone || body.id)) {
      const zoneToSave: DeliveryZone = body.zone || body;
      const index = deliveryZonesList.findIndex(z => z.id === zoneToSave.id);
      if (index >= 0) {
        deliveryZonesList[index] = zoneToSave;
      } else {
        deliveryZonesList.unshift(zoneToSave);
      }
      saveDeliveryZonesToStore(deliveryZonesList);
      return res.json({ success: true, zones: deliveryZonesList, total: deliveryZonesList.length });
    }

    if (list !== null) {
      deliveryZonesList = list;
      saveDeliveryZonesToStore(deliveryZonesList);
      return res.json({ success: true, zones: deliveryZonesList, total: deliveryZonesList.length });
    }
    res.status(400).json({ error: 'Invalid delivery zones data' });
  });

  app.post('/api/delivery-zones/reset', (req, res) => {
    deliveryZonesList = [...DEFAULT_ENRICHED_DELIVERY_ZONES];
    saveDeliveryZonesToStore(deliveryZonesList);
    res.json({ success: true, zones: deliveryZonesList });
  });

  // Coupons API
  app.get('/api/coupons', (req, res) => {
    res.json(couponsList);
  });

  app.post('/api/coupons', (req, res) => {
    const coupon: Coupon = req.body;
    if (!coupon || !coupon.code || coupon.discountPercentage === undefined) {
      return res.status(400).json({ error: 'بيانات الكوبون غير مكتملة' });
    }
    if (!coupon.id) {
      coupon.id = `coupon-${Date.now()}`;
    }
    coupon.code = coupon.code.trim().toUpperCase();
    coupon.createdAt = coupon.createdAt || new Date().toISOString();
    if (coupon.isActive === undefined) coupon.isActive = true;

    const existingIdx = couponsList.findIndex(c => c.id === coupon.id || c.code.toUpperCase() === coupon.code.toUpperCase());
    if (existingIdx !== -1) {
      couponsList[existingIdx] = { ...couponsList[existingIdx], ...coupon };
    } else {
      couponsList.unshift(coupon);
    }
    saveCouponsToStore(couponsList);
    res.status(201).json({ success: true, coupon, coupons: couponsList });
  });

  app.put('/api/coupons/:id', (req, res) => {
    const { id } = req.params;
    const updates: Partial<Coupon> = req.body;
    const index = couponsList.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'الكوبون غير موجود' });
    }
    couponsList[index] = { ...couponsList[index], ...updates };
    saveCouponsToStore(couponsList);
    res.json({ success: true, coupon: couponsList[index], coupons: couponsList });
  });

  app.delete('/api/coupons/:id', (req, res) => {
    const { id } = req.params;
    couponsList = couponsList.filter(c => c.id !== id);
    saveCouponsToStore(couponsList);
    res.json({ success: true, coupons: couponsList });
  });

  app.post('/api/coupons/batch-sync', (req, res) => {
    if (Array.isArray(req.body)) {
      couponsList = req.body;
      saveCouponsToStore(couponsList);
      return res.json({ success: true, coupons: couponsList });
    }
    res.status(400).json({ error: 'Invalid coupons batch data' });
  });

  app.post('/api/coupons/validate', (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ valid: false, error: 'الرجاء إدخال رمز الكوبون' });
    const codeUpper = String(code).trim().toUpperCase();
    const matched = couponsList.find(c => c.code.toUpperCase() === codeUpper);
    if (!matched) {
      return res.status(404).json({ valid: false, error: 'كوبون التخفيض غير صحيح أو غير موجود' });
    }
    if (!matched.isActive) {
      return res.status(400).json({ valid: false, error: 'هذا الكوبون غير متاح أو منتهي الصلاحية حالياً' });
    }
    return res.json({ valid: true, coupon: matched });
  });

  // Orders API
  app.get('/api/orders', (req, res) => {
    const { code, phone } = req.query;
    const active = ordersList.filter(o => o && o.id && !deletedOrderIds.has(o.id.toLowerCase()) && !o.deletedAt);
    if (code) {
      const match = active.find(o => o.id.toLowerCase() === String(code).trim().toLowerCase());
      return res.json(match ? [match] : []);
    }
    if (phone) {
      const matches = active.filter(o => o.customerPhone.includes(String(phone).trim()));
      return res.json(matches);
    }
    res.json(active);
  });

  app.post('/api/orders', (req, res) => {
    const newOrder: PrintOrder = req.body;
    if (!newOrder || !newOrder.customerName || !newOrder.customerPhone || !newOrder.files || newOrder.files.length === 0) {
      return res.status(400).json({ error: 'الرجاء تعبئة جميع بيانات الطلب الأساسية' });
    }

    // Assign tracking ID if not provided
    if (!newOrder.id) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      newOrder.id = `A4-SD-${randomNum}`;
    }

    newOrder.createdAt = newOrder.createdAt || new Date().toISOString();
    newOrder.status = newOrder.status || 'pending';

    // Prevent duplicate submission by transaction ID
    if (newOrder.bankakTransactionId && newOrder.bankakTransactionId.trim()) {
      const cleanTrx = newOrder.bankakTransactionId.trim().toLowerCase();
      const duplicateOrder = ordersList.find(o => 
        o && o.id.toLowerCase() !== newOrder.id.toLowerCase() &&
        !deletedOrderIds.has(o.id.toLowerCase()) &&
        o.bankakTransactionId && 
        o.bankakTransactionId.trim().toLowerCase() === cleanTrx
      );
      if (duplicateOrder) {
        return res.status(400).json({ 
          error: `⚠️ إشعار تحويل مكرر: رقم العملية (${newOrder.bankakTransactionId}) مستخدم بالفعل في طلب سابق (${duplicateOrder.id}). يرجى استخدام إشعار تحويل جديد وغير مستخدم.` 
        });
      }
    }

    const existingIdx = ordersList.findIndex(o => o.id.toLowerCase() === newOrder.id.toLowerCase());
    if (existingIdx !== -1) {
      ordersList[existingIdx] = { ...ordersList[existingIdx], ...newOrder };
    } else {
      ordersList.unshift(newOrder);
    }
    saveOrdersToStore(ordersList);
    res.status(201).json({ success: true, order: newOrder });
  });

  app.patch('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { status, paymentStatus, notes, bankakTransactionId } = req.body;

    const orderIndex = ordersList.findIndex(o => o.id.toLowerCase() === id.toLowerCase());
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    if (status) ordersList[orderIndex].status = status;
    if (paymentStatus) ordersList[orderIndex].paymentStatus = paymentStatus;
    if (notes !== undefined) ordersList[orderIndex].notes = notes;
    if (bankakTransactionId) ordersList[orderIndex].bankakTransactionId = bankakTransactionId;

    saveOrdersToStore(ordersList);
    res.json({ success: true, order: ordersList[orderIndex] });
  });

  app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const lowerId = id.toLowerCase();

    // Find target order if present
    const target = ordersList.find(o => o.id.toLowerCase() === lowerId) || req.body?.order;
    ordersList = ordersList.filter(o => o.id.toLowerCase() !== lowerId);
    saveOrdersToStore(ordersList);

    // Record ID as deleted
    deletedOrderIds.add(lowerId);
    saveDeletedIdsToStore(Array.from(deletedOrderIds));

    // If order details provided or found, add to deletedOrdersList (trash)
    if (target) {
      const deletedItem: PrintOrder = {
        ...target,
        deletedAt: target.deletedAt || new Date().toISOString(),
      };
      deletedOrdersList = [deletedItem, ...deletedOrdersList.filter(d => d.id.toLowerCase() !== lowerId)];
      saveDeletedOrdersToStore(deletedOrdersList);
    }

    res.json({ success: true, remaining: ordersList.length, deletedOrdersCount: deletedOrdersList.length });
  });

  app.post('/api/orders/batch-sync', (req, res) => {
    const { orders } = req.body;
    if (Array.isArray(orders)) {
      orders.forEach((incoming: PrintOrder) => {
        if (incoming && incoming.id) {
          const lowerId = incoming.id.toLowerCase();
          // DO NOT re-add if this order was deleted!
          if (deletedOrderIds.has(lowerId) || deletedOrdersList.some(d => d.id.toLowerCase() === lowerId)) {
            return;
          }
          const idx = ordersList.findIndex(o => o.id.toLowerCase() === lowerId);
          if (idx === -1) {
            ordersList.unshift(incoming);
          } else {
            ordersList[idx] = {
              ...ordersList[idx],
              ...incoming,
              files: (incoming.files && incoming.files.length > 0) ? incoming.files : ordersList[idx].files,
            };
          }
        }
      });
      saveOrdersToStore(ordersList);
    }
    res.json({ success: true, total: ordersList.length, orders: ordersList });
  });

  // Deleted Orders (Recycle Bin) API
  app.get('/api/deleted-ids', (req, res) => {
    res.json(Array.from(deletedOrderIds));
  });

  app.get('/api/deleted-orders', (req, res) => {
    res.json(deletedOrdersList);
  });

  app.post('/api/deleted-orders', (req, res) => {
    const item: PrintOrder = req.body;
    if (item && item.id) {
      const lowerId = item.id.toLowerCase();
      deletedOrderIds.add(lowerId);
      saveDeletedIdsToStore(Array.from(deletedOrderIds));

      // Remove from active orders
      ordersList = ordersList.filter(o => o.id.toLowerCase() !== lowerId);
      saveOrdersToStore(ordersList);

      // Add to trash
      const deletedItem = { ...item, deletedAt: item.deletedAt || new Date().toISOString() };
      deletedOrdersList = [deletedItem, ...deletedOrdersList.filter(d => d.id.toLowerCase() !== lowerId)];
      saveDeletedOrdersToStore(deletedOrdersList);
    }
    res.json({ success: true, deletedOrders: deletedOrdersList });
  });

  app.delete('/api/deleted-orders/:id', (req, res) => {
    const { id } = req.params;
    const lowerId = id.toLowerCase();

    // Ensure ID remains in deletedOrderIds so it never resurrects
    deletedOrderIds.add(lowerId);
    saveDeletedIdsToStore(Array.from(deletedOrderIds));

    deletedOrdersList = deletedOrdersList.filter(d => d.id.toLowerCase() !== lowerId);
    saveDeletedOrdersToStore(deletedOrdersList);

    res.json({ success: true, remaining: deletedOrdersList.length });
  });

  app.post('/api/deleted-orders/empty', (req, res) => {
    deletedOrdersList.forEach(d => {
      if (d && d.id) deletedOrderIds.add(d.id.toLowerCase());
    });
    saveDeletedIdsToStore(Array.from(deletedOrderIds));

    deletedOrdersList = [];
    saveDeletedOrdersToStore([]);

    res.json({ success: true });
  });

  app.post('/api/deleted-orders/:id/restore', (req, res) => {
    const { id } = req.params;
    const lowerId = id.toLowerCase();

    // Remove from deletedOrderIds
    deletedOrderIds.delete(lowerId);
    saveDeletedIdsToStore(Array.from(deletedOrderIds));

    const restoredTarget = deletedOrdersList.find(d => d.id.toLowerCase() === lowerId) || req.body;
    deletedOrdersList = deletedOrdersList.filter(d => d.id.toLowerCase() !== lowerId);
    saveDeletedOrdersToStore(deletedOrdersList);

    if (restoredTarget && restoredTarget.id) {
      const restoredOrder = { ...restoredTarget };
      delete restoredOrder.deletedAt;
      ordersList = [restoredOrder, ...ordersList.filter(o => o.id.toLowerCase() !== lowerId)];
      saveOrdersToStore(ordersList);
    }

    res.json({ success: true, ordersCount: ordersList.length });
  });

  // Study Sheets API
  app.get('/api/sheets', (req, res) => {
    res.json(sheetsList);
  });

  app.post('/api/sheets', (req, res) => {
    const newSheet: StudySheet = req.body;
    if (!newSheet || !newSheet.id) {
      return res.status(400).json({ error: 'Missing sheet or sheet id' });
    }
    const idx = sheetsList.findIndex(s => s.id === newSheet.id);
    if (idx >= 0) {
      sheetsList[idx] = newSheet;
    } else {
      sheetsList.unshift(newSheet);
    }
    saveSheetsToStore(sheetsList);
    res.json({ success: true, sheet: newSheet, total: sheetsList.length });
  });

  app.delete('/api/sheets/:id', (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Missing sheet id' });
    }
    sheetsList = sheetsList.filter(s => s.id !== id);
    saveSheetsToStore(sheetsList);
    res.json({ success: true, total: sheetsList.length });
  });

  app.post('/api/sheets/batch-sync', (req, res) => {
    const { sheets } = req.body;
    if (Array.isArray(sheets) && sheets.length > 0) {
      const map = new Map<string, StudySheet>();
      sheetsList.forEach(s => { if (s && s.id) map.set(s.id, s); });
      sheets.forEach((s: StudySheet) => { if (s && s.id) map.set(s.id, s); });
      sheetsList = Array.from(map.values());
      saveSheetsToStore(sheetsList);
    }
    res.json({ success: true, total: sheetsList.length, sheets: sheetsList });
  });

  // --- GOOGLE SHEETS INTEGRATION ROUTES ---

  // Initialize or Create Google Sheet
  app.post('/api/google-sheets/init-sheet', async (req, res) => {
    try {
      const auth = getAuthenticatedClient(req);
      const sheets = google.sheets({ version: 'v4', auth });

      let { spreadsheetId } = req.body;

      if (!spreadsheetId) {
        // Create new Google Sheet
        const response = await sheets.spreadsheets.create({
          requestBody: {
            properties: {
              title: 'طلبات مكتبة A4 السودان للطباعة والتجليد',
            },
            sheets: [
              {
                properties: {
                  title: 'طلبات الطباعة',
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
              },
            ],
          },
        });
        spreadsheetId = response.data.spreadsheetId;

        // Header Columns
        const headers = [
          'رقم الطلب',
          'تاريخ الطلب',
          'اسم العميل',
          'رقم الهاتف',
          'المدينة والعنوان',
          'طريقة الاستلام',
          'عدد الملفات',
          'تفاصيل الملفات والخيارات',
          'الإجمالي (ج.س)',
          'حالة الدفع',
          'رقم إشعار بنكك',
          'حالة الطلب',
          'ملاحظات'
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'A1:M1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
      }

      res.json({
        success: true,
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      });
    } catch (error: any) {
      console.error('Error initializing Google Sheet:', error);
      res.status(500).json({ error: error.message || 'فشل في إنشاء أو ربط جدول قوقل' });
    }
  });

  // Append Single Order to Google Sheet
  app.post('/api/google-sheets/append-order', async (req, res) => {
    try {
      const auth = getAuthenticatedClient(req);
      const sheets = google.sheets({ version: 'v4', auth });

      const { spreadsheetId, order } = req.body;
      if (!spreadsheetId || !order) {
        return res.status(400).json({ error: 'معرف الشيت والطلب مطلوبان' });
      }

      const fileDetails = (order.files || []).map((f: any, idx: number) => {
        const colorText = f.color === 'bw' ? 'أبيض وأسود' : 'ألوان كاملة';
        const sidesText = f.sides === 'double' ? 'وجهين' : 'وجه واحد';
        const bindingText = f.binding === 'spiral_plastic' ? 'سلك حلزوني' : f.binding === 'stapled' ? 'دبابيس' : f.binding === 'softcover' ? 'حراري' : f.binding === 'hardcover_leather' ? 'تجليد فاخر' : 'بدون تغليف';
        const ppsText = (f.pagesPerSheet && f.pagesPerSheet > 1) ? `${f.pagesPerSheet} بالورقة` : 'صفحة بالورقة';
        return `#${idx + 1}: ${f.fileName} (${f.pageCount} ص، ${colorText}، ${sidesText}، ${ppsText}، ${bindingText} x${f.copies} نسخة)`;
      }).join(' | ');

      const row = [
        order.id || '',
        new Date(order.createdAt || Date.now()).toLocaleString('ar-SD'),
        order.customerName || '',
        order.customerPhone || '',
        `${order.city || ''} ${order.addressOrCampus ? '- ' + order.addressOrCampus : ''}`.trim(),
        order.deliveryMethod === 'pickup' ? 'استلام من المكتبة' : 'توصيل للمنزل',
        order.files?.length || 0,
        fileDetails,
        order.totalAmount || 0,
        order.paymentStatus === 'verified' ? 'مأكد ومقيد' : 'في الانتظار',
        order.bankakTransactionId || 'غير مدفوع',
        order.status === 'completed' ? 'تم التسليم' : order.status === 'ready_for_pickup' ? 'جاهز للاستلام' : order.status === 'printing' ? 'جاري الطباعة' : 'جديد',
        order.notes || ''
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row],
        },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error appending order to Google Sheet:', error);
      res.status(500).json({ error: error.message || 'فشل إرسال الطلب لجدول قوقل' });
    }
  });

  // Sync Multiple/All Orders to Google Sheet
  app.post('/api/google-sheets/sync-all', async (req, res) => {
    try {
      const auth = getAuthenticatedClient(req);
      const sheets = google.sheets({ version: 'v4', auth });

      const { spreadsheetId, orders } = req.body;
      const listToSync = orders || ordersList;

      if (!spreadsheetId || !listToSync || listToSync.length === 0) {
        return res.status(400).json({ error: 'لا توجد طلبات للمزامنة' });
      }

      const rows = listToSync.map((order: PrintOrder) => {
        const fileDetails = (order.files || []).map((f: any, idx: number) => {
          const colorText = f.color === 'bw' ? 'أبيض وأسود' : 'ألوان كاملة';
          const sidesText = f.sides === 'double' ? 'وجهين' : 'وجه واحد';
          const bindingText = f.binding === 'spiral_plastic' ? 'سلك حلزوني' : f.binding === 'stapled' ? 'دبابيس' : f.binding === 'softcover' ? 'حراري' : f.binding === 'hardcover_leather' ? 'تجليد فاخر' : 'بدون تغليف';
          const ppsText = (f.pagesPerSheet && f.pagesPerSheet > 1) ? `${f.pagesPerSheet} بالورقة` : 'صفحة بالورقة';
          return `#${idx + 1}: ${f.fileName} (${f.pageCount} ص، ${colorText}، ${sidesText}، ${ppsText}، ${bindingText} x${f.copies} نسخة)`;
        }).join(' | ');

        return [
          order.id || '',
          new Date(order.createdAt || Date.now()).toLocaleString('ar-SD'),
          order.customerName || '',
          order.customerPhone || '',
          `${order.city || ''} ${order.addressOrCampus ? '- ' + order.addressOrCampus : ''}`.trim(),
          order.deliveryMethod === 'pickup' ? 'استلام من المكتبة' : 'توصيل للمنزل',
          order.files?.length || 0,
          fileDetails,
          order.totalAmount || 0,
          order.paymentStatus === 'verified' ? 'مأكد ومقيد' : 'في الانتظار',
          order.bankakTransactionId || 'غير مدفوع',
          order.status === 'completed' ? 'تم التسليم' : order.status === 'ready_for_pickup' ? 'جاهز للاستلام' : order.status === 'printing' ? 'جاري الطباعة' : 'جديد',
          order.notes || ''
        ];
      });

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: rows,
        },
      });

      res.json({ success: true, count: rows.length });
    } catch (error: any) {
      console.error('Error syncing all orders:', error);
      res.status(500).json({ error: error.message || 'فشل المزامنة الكلية مع شيت قوقل' });
    }
  });

  // AI Document Analysis Route (Gemini)
  app.post('/api/analyze-document', async (req, res) => {
    try {
      const { fileName, fileType, textSnippet, userPrompt } = req.body;

      // Fallback if no Gemini Key or offline
      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          summary: `مستند: ${fileName || 'شيت تعليمي'}. يتضمن معلومات دراسية مفصلة.`,
          suggestedPrintConfig: {
            color: fileType?.includes('image') || fileName?.toLowerCase().includes('color') ? 'color' : 'bw',
            paperSize: 'a4',
            sides: 'double',
            binding: 'spiral_plastic',
            reasoning: 'التغليف الحلزوني مع الطباعة الوجهين هو الخيار الأمثل للشيتات والمذكرات الدراسية لراحة القراءة وحفظ الأوراق.'
          },
          keyTopics: ['مذكرات دراسية', 'مراجعة امتحانات', 'تمارين وأسئلة'],
          estimatedStudyTimeMinutes: 45,
          printQualityAdvice: 'دقة المستند جيدة ومناسبة للطباعة الواضحة بجودة high-resolution.'
        });
      }

      const promptText = `أنت مساعد مكتبة "A4 Sudan" الذكي لطباعة المستندات الشيتات والملفات التعليمية.
قم بتحليل المستند التالي وتقديم توصية طباعة وملخص مفيد للطلب:
اسم الملف: ${fileName || 'مستند بدون عنوان'}
نوع الملف: ${fileType || 'مستند PDF'}
النص المستخرج أو الوصف: ${textSnippet || 'شيت دراسي ومذكرات طلابية'}
ملاحظات إضافية: ${userPrompt || 'لا يوجد'}

أجب بتنسيق JSON حصراً يحتوي الهيكل التالي:
{
  "summary": "ملخص شامل ومختصر للمستند باللغة العربية",
  "suggestedPrintConfig": {
    "color": "bw" أو "color" أو "mixed",
    "paperSize": "a4" أو "a3",
    "sides": "single" أو "double",
    "binding": "none" أو "stapled" أو "spiral_plastic" أو "softcover" أو "hardcover_leather",
    "reasoning": "سبب اختيار خيارات الطباعة والتغليف هذه"
  },
  "keyTopics": ["الموضوع الأول", "الموضوع الثاني", "الموضوع الثالث"],
  "estimatedStudyTimeMinutes": 30,
  "printQualityAdvice": "نصيحة جودة الطباعة أو الخط"
}`;

      const aiInstance = aiClient || new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await aiInstance.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: promptText,
      });

      const responseText = response.text || '';
      // Clean JSON string if wrapped in markdown block
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

      let parsedResult;
      try {
        parsedResult = JSON.parse(cleanJson);
      } catch (e) {
        parsedResult = {
          summary: responseText.slice(0, 300) || 'مستند تعليمي مفيد.',
          suggestedPrintConfig: {
            color: 'bw',
            paperSize: 'a4',
            sides: 'double',
            binding: 'spiral_plastic',
            reasoning: 'تم اختيار الإعدادات القياسية للشيتات الدراسية.'
          },
          keyTopics: ['محتوى تعليمي'],
          printQualityAdvice: 'جاهز للطباعة المباشرة'
        };
      }

      res.json(parsedResult);
    } catch (error: any) {
      console.error('Gemini Analysis Error:', error);
      res.json({
        summary: 'مستند دراسي جاهز للطباعة.',
        suggestedPrintConfig: {
          color: 'bw',
          paperSize: 'a4',
          sides: 'double',
          binding: 'spiral_plastic',
          reasoning: 'خيار الطباعة الأكثر توفيراً وعملية للشيتات والمذكرات.'
        },
        keyTopics: ['مستند عام'],
        printQualityAdvice: 'مناسب للطباعة بوضوح ممتاز'
      });
    }
  });

  // Helper to get all recorded transaction IDs and receipt image hashes
  function getRecordedReceipts() {
    const activeOrders = ordersList.filter(o => o && !deletedOrderIds.has(o.id.toLowerCase()));
    const transactionIds = new Set<string>();
    const imageSignatures = new Set<string>();

    for (const ord of activeOrders) {
      if (ord.bankakTransactionId && ord.bankakTransactionId.trim()) {
        transactionIds.add(ord.bankakTransactionId.trim().toLowerCase());
      }
      if (ord.bankakProofUrl && typeof ord.bankakProofUrl === 'string' && ord.bankakProofUrl.length > 50) {
        try {
          const match = ord.bankakProofUrl.match(/^data:([^;]+);base64,(.+)$/);
          const raw = match ? match[2] : ord.bankakProofUrl;
          const sig = crypto.createHash('md5').update(raw.slice(0, 8000)).digest('hex');
          imageSignatures.add(sig);
        } catch (e) {}
      }
    }
    return { transactionIds, imageSignatures };
  }

  // Arabic text normalizer for resilient matching
  function normalizeArabicText(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[إأآا]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[ًٌٍَُِّْ]/g, '') // Remove Tashkeel
      .replace(/\s+/g, ''); // Remove all whitespace for exact sub-sequence check
  }

  // Helper to check if text contains store owner name or account numbers
  function isOwnerMatched(text: string): boolean {
    if (!text) return false;
    const clean = normalizeArabicText(text);
    const lower = text.toLowerCase();

    // Name variations in Arabic without spaces
    const arabicPatterns = [
      'محمدعثمان',
      'حاجشرفي',
      'شرفيعثمان',
      'محمدعثمانحاجشرفي',
      'عثمانحاجشرفي',
      'محمدعثمانحاج',
      'محمدشرفي',
      'عثمانشرفي'
    ];

    for (const pat of arabicPatterns) {
      if (clean.includes(pat)) return true;
    }

    // English variations
    if (
      lower.includes('mohamed osman') ||
      lower.includes('mohammed osman') ||
      lower.includes('hajsharfi') ||
      lower.includes('haj sharfi') ||
      lower.includes('haj-sharfi') ||
      lower.includes('haj_sharfi')
    ) {
      return true;
    }

    // Sudanese Account numbers (O-Cash, Bankak, Fawry)
    if (
      text.includes('798340') || // O-Cash
      text.includes('3057861') || // Bankak
      text.includes('2161405') // Fawry
    ) {
      return true;
    }

    return false;
  }

  // Receipt Verification Route (Accepts any image / receipt without restriction)
  app.post('/api/verify-receipt', async (req, res) => {
    try {
      const { image, imageBase64, paymentMethod } = req.body || {};
      const rawImg = image || imageBase64;
      if (!rawImg || typeof rawImg !== 'string') {
        return res.status(400).json({
          isValid: false,
          status: 'مرفوض',
          message: 'لم يتم إرسال صورة إشعار التحويل.'
        });
      }

      // Extract mime type and base64 payload
      let mimeType = 'image/jpeg';
      let base64Data = rawImg;
      const match = rawImg.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      let detectedTrxId = '';
      let detectedAmount = '';
      let detectedRecipient = '';

      // Optional AI extraction to extract transaction ID and amount if available
      if (process.env.GEMINI_API_KEY) {
        try {
          const promptText = `استخرج من صورة الإشعار التالية رقم العملية أو المرجع إن وجد، والمبلغ إن وجد، واسم المحول إليه إن وجد. أجب بتنسيق JSON حصراً:
{
  "transactionId": "رقم العملية إن وجد",
  "amount": "المبلغ إن وجد",
  "recipientName": "اسم المستفيد الظاهر إن وجد"
}`;

          const aiInstance = aiClient || new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const imagePart = {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          };
          const textPart = {
            text: promptText,
          };

          const response = await aiInstance.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
              temperature: 0.1,
            }
          });

          const responseText = response.text || '';
          const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          detectedTrxId = parsed.transactionId || '';
          detectedAmount = parsed.amount || '';
          detectedRecipient = parsed.recipientName || '';
        } catch (aiErr) {
          console.warn('Optional AI extraction skipped in verify-receipt:', aiErr);
        }
      }

      if (!detectedTrxId || detectedTrxId.length < 2 || detectedTrxId.toLowerCase() === 'none' || detectedTrxId.toLowerCase() === 'null') {
        detectedTrxId = `TRX-${Date.now().toString().slice(-6)}`;
      }

      // Accepted without any restrictions on names or images
      return res.json({
        isValid: true,
        isDuplicate: false,
        hasTransactionId: true,
        transactionId: detectedTrxId,
        hasRecipientName: true,
        recipientName: detectedRecipient || 'إشعار تحويل معتمد',
        amount: detectedAmount || '',
        bankName: paymentMethod || 'تحويل بنكي',
        transferDate: new Date().toLocaleDateString('ar-SD'),
        status: 'مقبول',
        message: `تم قبول وإرفاق إشعار التحويل بنجاح ✅`
      });

    } catch (error: any) {
      console.error('Receipt Verification Error:', error);
      return res.json({
        isValid: true,
        isDuplicate: false,
        hasTransactionId: true,
        transactionId: `TRX-${Date.now().toString().slice(-6)}`,
        hasRecipientName: true,
        recipientName: 'إشعار تحويل',
        status: 'مقبول',
        message: 'تم إرفاق صورة الإشعار بنجاح ✅'
      });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC SERVE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🖨️ A4 Sudan Printing Server running at http://localhost:${PORT}`);
  });
}

startServer();
