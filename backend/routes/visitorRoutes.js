import { configDotenv } from 'dotenv';
import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { io } from '../server.js'; // Import the Socket.io instance
import Visitor from '../models/Visitor.js'; // Import the Visitor model to update the database

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const router = express.Router();

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');  // Correct path
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

configDotenv();

const upload = multer({ storage });

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,  // Loaded from .env
      pass: process.env.EMAIL_PASS,  // App password from .env
    },
  });

// Visitor route
router.post('/visitor', upload.single('photo'), async (req, res) => {
    try {
      console.log('Request Body:', req.body);
      console.log('Uploaded File:', req.file);

      const { name, email, personToMeet, purpose } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: 'Photo upload is required.' });
      }

      const photoPath = path.join(__dirname, 'uploads', req.file.filename);

      const baseUrl = 'https://visit-mn0xh2mq8-itzz-aryan-121s-projects.vercel.app/';  // Use your production domain
      const approvalLink = `${baseUrl}/api/visitor/approve?visitor=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;
      const disapprovalLink = `${baseUrl}/api/visitor/disapprove?visitor=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;

      const emailHTML = `
            <h1>New Visitor Approval/Disapproval Request</h1>
            <p><strong>Visitor:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email || 'N/A'}</p>
            <p><strong>Purpose:</strong> ${purpose}</p>
            <p>Please review and respond to the visitor's request:</p>
            <p>
                <a href="${approvalLink}" style="padding: 10px; color: white; background-color: green; text-decoration: none;">Approve</a>
                &nbsp;&nbsp;
                <a href="${disapprovalLink}" style="padding: 10px; color: white; background-color: red; text-decoration: none;">Disapprove</a>
            </p>
        `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: personToMeet,
        subject: 'New Visitor Approval/Disapproval Request',
        html: emailHTML,
        text: `Visitor: ${name}\nEmail: ${email || 'N/A'}\nPurpose: ${purpose}`,
        attachments: [{ path: photoPath }],
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Email error:', err);
          return res.status(500).json({ message: 'Failed to send email.', error: err.message });
        }
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Visitor entry recorded and email sent for approval' });
      });
    } catch (error) {
      console.error('Backend error:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });

// Approve visitor
router.get('/visitor/approve', async (req, res) => {
    try {
        const { visitor, email } = req.query;

        // Update visitor status in the database
        await Visitor.findOneAndUpdate({ name: visitor, email }, { status: 'approved' });

        // Emit a real-time update to the frontend
        io.emit('statusUpdate', { visitor, status: 'approved' });

        // Notify the visitor via email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Visit Request Approved',
            text: `Hello ${visitor},\n\nYour request to meet has been approved!`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Email error:', err);
                return res.status(500).json({ message: 'Failed to send approval email.' });
            }
            console.log('Approval email sent:', info.response);
            res.redirect(`https://visit-mn0xh2mq8-itzz-aryan-121s-projects.vercel.app/visitor/status?status=approved`);
        });
    } catch (error) {
        console.error('Approval error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Disapprove visitor
router.get('/visitor/disapprove', async (req, res) => {
    try {
        const { visitor, email } = req.query;

        // Update visitor status in the database
        await Visitor.findOneAndUpdate({ name: visitor, email }, { status: 'disapproved' });

        // Emit a real-time update to the frontend
        io.emit('statusUpdate', { visitor, status: 'disapproved' });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Visit Request Disapproved',
            text: `Hello ${visitor},\n\nUnfortunately, your visit request was disapproved.`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Email error:', err);
                return res.status(500).json({ message: 'Failed to send disapproval email.' });
            }
            console.log('Disapproval email sent:', info.response);
            res.redirect(`https://visit-mn0xh2mq8-itzz-aryan-121s-projects.vercel.app/visitor/status?status=disapproved`);
        });
    } catch (error) {
        console.error('Disapproval error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
