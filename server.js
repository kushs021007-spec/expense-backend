import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* ================= USER MODEL ================= */

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    role:String
});

const User = mongoose.model("User", userSchema);

/* ================= EMAIL SETUP ================= */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

/* ================= REGISTER (CFO CREATES USER) ================= */

app.post("/create-user", async (req,res)=>{

    const {name,email,role} = req.body;

    const generatedPassword =
        Math.random().toString(36).slice(-8);

    const hashed =
        await bcrypt.hash(generatedPassword,10);

    const user = new User({
        name,
        email,
        password:hashed,
        role
    });

    await user.save();

    await transporter.sendMail({
        to: email,
        subject: "Your Account Created",
        text: `Your login password is: ${generatedPassword}`
    });

    res.json({message:"User created & email sent"});
});

/* ================= LOGIN ================= */

app.post("/login", async (req,res)=>{

    const {email,password} = req.body;

    const user = await User.findOne({email});
    if(!user)
        return res.status(400)
        .json({message:"User not found"});

    const valid =
        await bcrypt.compare(password,user.password);

    if(!valid)
        return res.status(400)
        .json({message:"Invalid password"});

    const token = jwt.sign(
        {id:user._id, role:user.role},
        process.env.JWT_SECRET
    );

    res.json({
        token,
        role:user.role
    });
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log("Server running...");
});
