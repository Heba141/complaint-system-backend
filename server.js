
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();

// ==========================================
// CRITICAL MIDDLEWARES (Must be at the top)
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use((req, res, next) => {
  console.log(`[INCOMING REQUEST] Method: ${req.method} | URL: ${req.url}`);
  next();
});

const JWT_SECRET = 'bau_fixed_test_secret_2026';

// --- AUTHENTICATION MIDDLEWARE ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token missing or unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired session token' });
    req.user = user;
    next();
  });
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log("--> 1. SIGNUP CONTROLLER REACHED", req.body);
    
    const fullName = req.body.fullName || req.body.name;
    const { email, phone, password, role } = req.body;
    let { universityId, faculty } = req.body;
    
    if (!fullName) {
      return res.status(400).json({ error: 'الاسم الكامل مطلوب' });
    }

    // Fallback if universityId is missing
    if (!universityId) {
      universityId = email ? email.split('@')[0] + '-' + Date.now() : 'STU-' + Date.now();
    }

    // Fallback if faculty is missing from frontend form
    if (!faculty) {
      faculty = 'كلية تكنولوجيا المعلومات'; // Default fallback value
    }

    const existingUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email }, 
          { universityId }
        ] 
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'البريد الإلكتروني أو الرقم الجامعي مسجل مسبقاً' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { 
        fullName, 
        universityId, 
        faculty, 
        email, 
        phone: phone || null, 
        passwordHash, 
        role: role || 'STUDENT' 
      }
    });

    return res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', userId: newUser.id });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب الخادم الداخلي' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const loginKey = email || identifier;

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: loginKey }, { universityId: loginKey }] }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ message: 'تم تسجيل الدخول بنجاح', token, role: user.role, fullName: user.fullName });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: 'خطأ في عملية تسجيل الدخول' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        universityId: true,
        faculty: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود في النظام' });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return res.status(500).json({ error: 'خطأ في جلب بيانات الملف الشخصي' });
  }
});

// ==========================================
// 2. COMPLAINT & REQUEST ROUTES
// ==========================================
const complaintRoutes = require('./src/routes/complaintRoutes');
app.use('/api/complaints', complaintRoutes);

app.post('/api/requests', authenticateToken, async (req, res) => {
  try {
    const { requestType, department, details, attachments } = req.body;
    const referenceCode = `DEMO-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest = await prisma.request.create({
      data: {
        referenceCode,
        userId: req.user.userId || req.user.id,
        requestType,
        department,
        details,
        status: 'RECEIVED',
        timeline: {
          create: [
            { stepNumber: 1, title: 'تم استلاستلام الطلب', description: 'تم تسجيل الطلب في قاعدة البيانات الأكاديمية بنجاح.', status: 'done' },
            { stepNumber: 2, title: 'قيد المراجعة والتدقيق', description: 'يتم مراجعة الطلب حالياً من قبل القسم المختص.', status: 'active', noteAuthor: 'مسجل الكلية • وحدة القبول', noteBody: 'تم تحويل الملف وجار التحقق من البيانات الأكاديمية.' },
            { stepNumber: 3, title: 'اتخاذ القرار والحل', description: 'صدور التقرير النهائي للطلب.', status: 'pending' },
            { stepNumber: 4, title: 'اعتماد عمادة القبول والتسجيل والإغلاق', description: 'إصدار وثيقة الإجراء النهائية.', status: 'pending' }
          ]
        },
        attachments: {
          create: attachments ? attachments.map(att => ({ fileUrl: att.url, fileName: att.name })) : []
        }
      },
      include: { timeline: true, attachments: true }
    });

    return res.status(201).json({ message: 'تم إرسال الطلب بنجاح', request: newRequest });
  } catch (error) {
    console.error("Request Creation Error:", error);
    return res.status(500).json({ error: 'تعذر حفظ الطلب في النظام' });
  }
});

app.get('/api/requests/track/:refCode', async (req, res) => {
  try {
    const request = await prisma.request.findUnique({
      where: { referenceCode: req.params.refCode },
      include: { 
        timeline: { orderBy: { stepNumber: 'asc' } }, 
        attachments: true,
        user: { select: { fullName: true, faculty: true } } 
      }
    });

    if (!request) return res.status(404).json({ error: 'الرمز المرجعي غير موجود في النظام' });
    return res.json(request);
  } catch (error) {
    console.error("Tracking Error:", error);
    return res.status(500).json({ error: 'خطأ في جلب بيانات التتبع' });
  }
});

app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const totalRequests = await prisma.request.count();
    const complaintsCount = await prisma.request.count({
      where: { requestType: { in: ['ACADEMIC_COMPLAINT', 'FINANCIAL_COMPLAINT', 'SERVICE_COMPLAINT'] } }
    });
    const suggestionsCount = await prisma.request.count({
      where: { requestType: 'DEVELOPMENT_SUGGESTION' }
    });

    const academicCount = await prisma.request.count({ where: { department: 'ACADEMIC_SECTION' } });
    const financialCount = await prisma.request.count({ where: { department: 'FINANCIAL_SECTION' } });
    const registrationCount = await prisma.request.count({ where: { department: 'REGISTRATION_STUDENT_AFFAIRS' } });

    return res.json({
      kpi: { totalRequests, complaintsCount, suggestionsCount },
      distribution: { academicCount, financialCount, registrationCount }
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return res.status(500).json({ error: 'فشل استرجاع الإحصائيات' });
  }
});

app.get('/api/admin/requests', authenticateToken, async (req, res) => {
  if (req.user.role !== 'SYSADMIN' && req.user.role !== 'STAFF' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'غير مسموح بالدخول إلى لوحة المشرف' });
  }

  try {
    const requests = await prisma.request.findMany({
      include: { user: { select: { fullName: true, faculty: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return res.json(requests);
  } catch (error) {
    console.error("Admin Fetch Error:", error);
    return res.status(500).json({ error: 'فشل تحميل الطلبات الإدارية' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running successfully on port ${PORT}`);
});