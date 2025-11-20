const Member = require("../models/membersModel");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModels");
const {
  sendEmail,
  generateEmailTemplate,
} = require("../config/emails/emailFunction");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// create a member
exports.createMember = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }

  const {
    firstName,
    surName,
    role,
    email,
    phone,
    organizationName,
    website,
    category,
  } = req.body;

  const requiredFields = [
    "firstName",
    "surName",
    "role",
    "email",
    "phone",
    "organizationName",
    "website",
    "category",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      res.status(400).send(`Missing required field: ${field}`);
      return;
    }
  }

  let newEmail = email.toString().trim().toLowerCase();
  let newPhone = phone.toString().trim();

  // Check for existing organization
  const existingMember = await Member.findOne({
    $or: [{ email: newEmail }, { phone: newPhone }],
  });

  if (existingMember) {
    if (existingMember.email === newEmail) {
      return res.status(400).json({
        success: false,
        message: "A member with this email already exists",
      });
    }
    if (existingMember.phone === newPhone) {
      return res.status(400).json({
        success: false,
        message: "A member with this phone number already exists",
      });
    }
  }

  const member = await Member.create({
    firstName,
    surName,
    role,
    email: newEmail,
    phone: newPhone,
    organizationName,
    website,
    category,
  });

  if (member) {
    res.status(201).json(member);
    return;
  } else {
    res.status(500).send("something went wrong");
    return;
  }
});

// fetch all members
exports.getAllMembers = asyncHandler(async (req, res) => {
  // Find all members
  const members = await Member.find().sort({ createdAt: -1 });
  if (members) {
    res.status(200).json(members);
  } else {
    res.status(500).send("Failed to fetch members");
  }
});

//fetch only approved members
exports.fetchApprovedMembers = asyncHandler(async (req, res) => {
  let approved = true;
  const members = await Member.find({ approved });
  if (members) {
    res.status(200).json(members);
    return;
  } else {
    throw new Error("Error Fetching Members");
  }
});

// see my organizations only
exports.getMyOrganzations = asyncHandler(async (req, res) => {
  // I need your email
  const email = req.user.email;
  if (!email) {
    res.status(400).send("Authorization Failed");
  }
  const members = await Member.find({ email }).sort({ createdAt: -1 });
  if (members) {
    res.status(200).json(members);
  } else {
    res.status(500).send("Failed to fetch your organizations");
  }
});

// fetch specific
exports.fetchSpecific = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id });
  if (member) {
    res.status(200).json(member);
  } else {
    res.status(500).send("Failed to fetch member");
  }
});

//update
exports.updateSpecific = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }
  const updatedMember = await Member.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    }
  );

  if (updatedMember) {
    res.status(200).json(updatedMember);
  } else {
    res.status(500).send("Error Updating Member");
  }
});

//delete
exports.deleteOrganization = asyncHandler(async (req, res) => {
  // check if exists
  const member = await Member.findById(req.params.id);

  if (!member) {
    res.status(500).send("member not found");
  } else {
    await Member.findByIdAndDelete(req.params.id);

    // Delete user account if exists
    const { email } = member;
    const isApproved = member.approved;
    if (isApproved) {
      await User.findOneAndDelete({ email });
    }

    res.status(200).json({ message: "Member deleted successfully" });
  }
});

// exports.toggleApproval = asyncHandler(async (req, res) => {
//   const memberId = req.params.id;

//   // Find member and validate existence
//   const member = await Member.findById(memberId);
//   if (!member) {
//     res.status(400).send("member not found");
//     return;
//   }

//   // Toggle approval status
//   const updatedMember = await Member.findByIdAndUpdate(
//     memberId,
//     { approved: !member.approved },
//     { new: true }
//   );

//   // if member is approved: create user details in auth system, send an email notification.
//   if (updatedMember.approved) {
//     const { email, organizationName, phone } = updatedMember;
//     const password = Math.random().toString(36).slice(-8); // generate a random password

//     // Check for existing records
//     const existingUser = await User.findOne({
//       $or: [{ email: email }, { phone: phone }],
//     });
//     if (existingUser) {
//       if (existingUser.email === email) {
//         res.status(400).send(`Email: ${email} already exists`);
//         return;
//       }
//       if (existingUser.phone === phone) {
//         res.status(400).send(`Phone: ${phone} already exists`);
//         return;
//       }
//     }
//     // hash the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     // Create user
//     const user = await User.create({
//       email: email,
//       organizationName: organizationName,
//       phone: phone,
//       password: hashedPassword,
//     });
//     if (user) {
//       // send email notification logic here
//       let fullName = `${updatedMember.firstName} ${updatedMember.surName}`;
//       const emailContent = `
//       <h2>Welcome to AI Skilling Alliance!</h2>
//       <p>Dear ${fullName},</p>
//       <p>Congratulations! Your application to join the Kenya AI Skilling Alliance (KAISA) has been approved.</p>
//       <p>You can now access and or upload courses, get KAISA programs, training opportunities and partner resources.
// </p>
//       <p><strong>Please use the following to details to sign in</strong></p>
//       <ul>
//         <li>Email: ${email}</li>
//         <li>Password: ${password}</li>
//       </ul>
//       <p>We're excited to have you on board!</p>
//       <br>
//       <p>Best regards,<br>AI Skilling Alliance Team</p>
//     `;

//       await sendEmail({
//         to: email, // receiver email address
//         subject: "Your KAISA Membership Has Been Approved",
//         html: generateEmailTemplate(
//           emailContent,
//           "Your KAISA Membership Has Been Approved"
//         ),
//       });
//     }
//   }

//   // if member is unapproved: send an email notification and delete user from db.
//   if (!updatedMember.approved) {
//     const { email } = updatedMember;
//     // Delete user
//     await User.findOneAndDelete({ email: email });
//     // send email notification logic here
//     let fullName = `${updatedMember.firstName} ${updatedMember.surName}`;
//     const emailContent = `
//       <h2>KAISA Membership Update!</h2>
//       <p>Dear ${fullName},</p>
//       <p>We regret to inform you that your membership with the Kenya AI Skilling Alliance (KAISA) has been revoked.</p>
//       <p>If you believe this is a mistake or have any questions, please contact our support team for assistance.
// </p>

//        <p>We appreciate your understanding in this matter.</p>
//       <br>
//       <p>Best regards,<br>AI Skilling Alliance Team</p>
//       <br>

//     `;

//     await sendEmail({
//       to: email, // receiver email address
//       subject: "Your KAISA Membership Has Been Revoked",
//       html: generateEmailTemplate(
//         emailContent,
//         "Your KAISA Membership Has Been Revoked"
//       ),
//     });
//   }

//   if (!updatedMember) {
//     res.status(400).send("Failed to update approved status");
//     return;
//   }

//   res.json(updatedMember);
// });

// Helper function for member approval

exports.toggleApproval = asyncHandler(async (req, res) => {
  const memberId = req.params.id;

  try {
    // Validate member ID
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID format",
      });
    }

    // Find member with proper error handling
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Toggle approval status
    const newApprovalStatus = !member.approved;

    // Handle approval/disapproval first
    if (newApprovalStatus) {
      await handleMemberApproval(member);
    } else {
      await handleMemberDisapproval(member);
    }

    // Then update member status
    const updatedMember = await Member.findByIdAndUpdate(
      memberId,
      { approved: newApprovalStatus },
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return res.status(500).json({
        success: false,
        message: "Failed to update member approval status",
      });
    }

    res.json({
      success: true,
      message: `Member ${
        newApprovalStatus ? "approved" : "disapproved"
      } successfully`,
      data: updatedMember,
    });
  } catch (error) {
    console.error("Toggle approval error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while processing approval",
      error: error.message,
    });
  }
});

const handleMemberApproval = async (member) => {
  try {
    const { email, organizationName, phone, firstName, surName } = member;

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error(`User with email ${email} already exists`);
      }
      if (existingUser.phone === phone) {
        throw new Error(`User with phone ${phone} already exists`);
      }
    }

    // Generate secure random password
    const password = Math.random().toString(36).slice(-8); // generate a random password;

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user account
    const user = await User.create([
      {
        email,
        organizationName,
        phone,
        password: hashedPassword,
      },
    ]);

    if (!user || user.length === 0) {
      throw new Error("Failed to create user account");
    }

    // Prepare and send approval email
    await sendApprovalEmail(member, password);
  } catch (error) {
    console.error("Member approval failed:", error);

    // Revert member approval status if user creation fails
    await Member.findByIdAndUpdate(member._id, { approved: false });

    throw new Error(`Failed to approve member: ${error.message}`);
  }
};

// Helper function for member disapproval
const handleMemberDisapproval = async (member) => {
  try {
    const { email } = member;

    // Delete user account if exists
    const deletedUser = await User.findOneAndDelete({ email });

    if (deletedUser) {
      console.log(`Deleted user account for: ${email}`);
    }

    // Send disapproval email (fire and forget to avoid timeouts)
    // sendDisapprovalEmail(member).catch((emailError) => {
    //   console.error("Failed to send disapproval email:", emailError);
    // });
  } catch (error) {
    console.error("Member disapproval failed:", error);
    throw new Error(`Failed to disapprove member: ${error.message}`);
  }
};

//dont send emails when disapproving members to avoid spamming

// Helper function to send approval email
const sendApprovalEmail = async (member, password) => {
  try {
    const fullName = `${member.firstName} ${member.surName}`;
    const emailContent = `
      <h2>Welcome to AI Skilling Alliance!</h2>
      <p>Dear ${fullName},</p>
      <p>Congratulations! Your application to join the Kenya AI Skilling Alliance (KAISA) has been approved.</p>
      <p>You can now access and upload courses, get KAISA programs, training opportunities and partner resources.</p>
      <p><strong>Please use the following details to sign in:</strong></p>
      <ul>
        <li><strong>Email:</strong> ${member.email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>We're excited to have you on board!</p>
      <br>
      <p>Best regards,<br>AI Skilling Alliance Team</p>
    `;

    await sendEmail({
      to: member.email,
      subject: "Your KAISA Membership Has Been Approved",
      html: generateEmailTemplate(
        emailContent,
        "Your KAISA Membership Has Been Approved"
      ),
    });

    console.log(`Approval email sent to: ${member.email}`);
  } catch (emailError) {
    console.error("Failed to send approval email:", emailError);
    // Don't throw error here - email failure shouldn't break the approval process
  }
};

// Helper function to send disapproval email
const sendDisapprovalEmail = async (member) => {
  try {
    const fullName = `${member.firstName} ${member.surName}`;
    const emailContent = `
      <h2>KAISA Membership Update</h2>
      <p>Dear ${fullName},</p>
      <p>We regret to inform you that your membership with the Kenya AI Skilling Alliance (KAISA) has been revoked.</p>
      <p>If you believe this is a mistake or have any questions, please contact our support team for assistance.</p>
      <p>We appreciate your understanding in this matter.</p>
      <br>
      <p>Best regards,<br>AI Skilling Alliance Team</p>
    `;

    await sendEmail({
      to: member.email,
      subject: "Your KAISA Membership Has Been Revoked",
      html: generateEmailTemplate(
        emailContent,
        "Your KAISA Membership Has Been Revoked"
      ),
    });

    console.log(`Disapproval email sent to: ${member.email}`);
  } catch (emailError) {
    console.error("Failed to send disapproval email:", emailError);
    // Don't throw error here - email failure shouldn't break the disapproval process
  }
};
