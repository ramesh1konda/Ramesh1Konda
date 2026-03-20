import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to send email notifications
  app.post('/api/notify', async (req, res) => {
    const { to, subject, html } = req.body;

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set. Email notification skipped.');
      return res.status(200).json({ success: true, message: 'Email skipped (no API key)' });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'LendFlow Pro <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('Resend Error:', error);
        return res.status(400).json({ success: false, error });
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Internal Server Error:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
