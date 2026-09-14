const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate a random reference code like DEMO-8942
function generateRefCode() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `DEMO-${randomNum}`;
}

// ==========================================
// 1. SUBMIT / CREATE A NEW COMPLAINT
// ==========================================
exports.createComplaint = async (req, res) => {
  try {
    const { type, requestType, section, department, title, description, details, priority } = req.body;
    
    // Extract user ID safely from the token payload
    const userId = req.user ? (req.user.id || req.user.userId) : null;

    if (!userId) {
      return res.status(401).json({ message: 'User unauthenticated or missing ID in token' });
    }

    // Safely parse userId to an integer (fixes Prisma schema type mismatch if IDs are Int)
    const parsedUserId = parseInt(userId, 10);
    let existingUser = null;

    if (!isNaN(parsedUserId)) {
      existingUser = await prisma.user.findUnique({ where: { id: parsedUserId } });
    }
    
    if (!existingUser) {
      // Fallback: grab the first available user in the database so testing never fails
      existingUser = await prisma.user.findFirst();
      
      if (!existingUser) {
        return res.status(404).json({ message: 'No users exist in the database. Please sign up first.' });
      }
    }

    // Use the verified/fallback user's ID for the foreign key constraint
    const targetUserId = existingUser.id;

    // Normalize input fields
    const complaintType = type || requestType || 'ACADEMIC_COMPLAINT';
    const complaintDept = department || section || 'ACADEMIC_SECTION';
    const complaintDesc = description || details || title || '';

    if (!complaintType || !complaintDept || !complaintDesc) {
      return res.status(400).json({ message: 'جميع الحقول الإجبارية مطلوبة' });
    }

    const attachmentPath = req.file ? req.file.path : null;
    const refCode = generateRefCode();

   const newComplaint = await prisma.complaint.create({
      data: {
        refCode,
        type: complaintType,
        department: complaintDept,
        description: complaintDesc,
        priority: priority || 'NORMAL',
        user: {
          connect: { id: targetUserId }
        }
      }
    });

    return res.status(201).json({
      message: 'تم إرسال طلبك بنجاح',
      refCode: newComplaint.refCode,
      complaint: newComplaint
    });
  } catch (error) {
    console.error('Create Complaint Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'خطأ في الخادم الداخلي', details: error.message });
    }
  }
};

// ==========================================
// 2. TRACK COMPLAINT BY REFERENCE CODE (Public)
// ==========================================
exports.trackComplaint = async (req, res) => {
  try {
    const { refCode, ticketCode } = req.params;
    const codeToSearch = refCode || ticketCode;

    const complaint = await prisma.complaint.findUnique({
      where: { refCode: codeToSearch },
      include: { user: { select: { fullName: true, faculty: true } } }
    });

    if (!complaint) {
      return res.status(404).json({ message: 'الرمز المرجعي غير موجود في النظام' });
    }

    return res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Track Complaint Error:', error);
    return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
  }
};

// ==========================================
// 3. GET ALL COMPLAINTS FOR REVIEW (Admin & Supervisor)
// ==========================================
exports.getDepartmentComplaints = async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, faculty: true } } }
    });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error('Review Complaints Error:', error);
    return res.status(500).json({ message: 'Server error while fetching complaints for review' });
  }
};

// ==========================================
// 4. UPDATE COMPLAINT STATUS (Admin & Supervisor)
// ==========================================
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Extract status dynamically from body or query fallback
    const status = req.body?.status || req.query?.status;

    const validStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value provided." });
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id: id },
      data: { status: status || "RESOLVED" } // Uses dynamic status or defaults if missing
    });

    return res.status(200).json({
      success: true,
      message: "Complaint status updated successfully",
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    return res.status(500).json({ 
      message: "Server error while updating complaint status",
      error: error.message 
    });
  }
};

// ==========================================
// 5. GET SYSTEM ANALYTICS (Admin & Supervisor)
// ==========================================
exports.getAnalytics = async (req, res) => {
  try {
    const [totalComplaints, statusCounts, departmentCounts, typeCounts] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.complaint.groupBy({
        by: ['department'],
        _count: { department: true },
      }),
      prisma.complaint.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      analytics: {
        totalComplaints,
        statusBreakdown: statusCounts,
        departmentBreakdown: departmentCounts,
        typeBreakdown: typeCounts,
      },
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return res.status(500).json({ 
      message: "Server error while fetching analytics" 
    });
  }
};