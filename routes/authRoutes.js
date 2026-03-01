import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import User from "../models/User.js";
import auth from "../middleware/auth.js";
import roleMiddleware from "../middleware/role.js";

const router = express.Router();

/* ================= EMAIL CONFIG ================= */

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // IMPORTANT
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= CFO CREATE USER (SECURED) ================= */

router.post(
  "/create-user",
  auth,
  roleMiddleware(["cfo"]),
  async (req, res) => {
    try {
      const { name, email, role } = req.body;

      if (!name || !email || !role) {
        return res.status(400).json({ message: "All fields required" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Generate random password
      const password = Math.random().toString(36).slice(-8);

      // Hash password
      const hashed = await bcrypt.hash(password, 10);

      const user = new User({
        name,
        email,
        password: hashed,
        role
      });

      await user.save();

      console.log("Generated Password:", password);

      // Send email with password
      await transporter.sendMail({
        from: `"Expense Management" <${process.env.EMAIL}>`,
        to: email,
        subject: "Your Account Credentials",
        text: `Hello ${name},

    Your account has been created successfully.

    Email: ${email}
    Password: ${password}

    Please login and change your password.

    Regards,
    Expense Team`
    });

      res.json({ message: "User Created Successfully" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* ================= LOGIN ================= */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});
router.post("/create-initial-cfo", async (req, res) => {
  const bcrypt = (await import("bcryptjs")).default;

  const hashed = await bcrypt.hash("12345678", 10);

  const user = new User({
    name: "Admin CFO",
    email: "yourgmail@gmail.com",
    password: hashed,
    role: "cfo"
  });

  await user.save();

  res.json({ message: "CFO created" });
});
export default router;
