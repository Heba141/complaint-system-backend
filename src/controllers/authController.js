const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Signup Controller
exports.signup = async (req, res) => {
  try {
    console.log("--> 1. SIGNUP CONTROLLER REACHED", req.body);
    const { fullName, universityId, faculty, email, phone, password, role } = req.body;

    console.log("--> 2. CHECKING IF USER EXISTS IN DB...");
    const existingUser = await prisma.user.findUnique({ where: { email } });
    console.log("--> 3. USER CHECK FINISHED:", existingUser);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in PostgreSQL using Prisma
    const newUser = await prisma.user.create({
      data: {
        fullName,
        universityId,
        faculty,
        email,
        phone,
        passwordHash,
        role: role || 'STUDENT'
      }
    });

    res.status(201).json({
      message: "تم إنشاء الحساب بنجاح",
      userId: newUser.id
    });

  } catch (error) {
    console.error("SIGNUP CRITICAL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Login Controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("ATTEMPTING LOGIN FOR EMAIL:", email);

    // Find user using Prisma
    const user = await prisma.user.findUnique({ where: { email } });
    console.log("DEBUG FOUND USER:", user);
    
    if (!user) {
      return res.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة - User not found in DB' });
    }

    // Check both property variations to handle column mapping mismatches safely
    const storedHash = user.passwordHash || user.password_hash;
    console.log("DEBUG STORED HASH:", storedHash ? "Exists" : "MISSING/UNDEFINED");

    if (!storedHash) {
      return res.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة - Password hash missing' });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, storedHash);
    console.log("DEBUG PASSWORD MATCH RESULT:", validPassword);

    if (!validPassword) {
      return res.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة - Password mismatch' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        department: user.department || user.department_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.fullName || user.name, 
        role: user.role 
      } 
    });

  } catch (error) {
    console.error("LOGIN CRITICAL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.getCurrentUser = async (req, res) => {
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
};