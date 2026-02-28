import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

/* CFO Creates User */
router.post("/create-user", async (req, res) => {

  const { name, email, role } = req.body;

  const password = Math.random().toString(36).slice(-8);

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    password: hashed,
    role
  });

  await user.save();

  await transporter.sendMail({
    to: email,
    subject: "Your Account Created",
    text: `Your password is: ${password}`
  });

  res.json({ message: "User Created" });
});

/* Login */
router.post("/login", async (req, res) => {

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.status(400).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);

  if (!valid)
    return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET
  );

  res.json({ token, role: user.role });
});

export default router;
