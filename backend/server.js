import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dataFilePath = path.join(__dirname, '../database/data.json');

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uglribyijrwkrsqpuctx.supabase.co';
const supabaseKey = 'sb_publishable_gN6bkMtvehOrNUHeIuYR1Q_QTFTLuiu';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para leer base de datos JSON desde Supabase
async function readDB() {
  try {
    const { data, error } = await supabase.from('json_db').select('data').eq('id', 1).single();
    if (data && data.data) {
      return data.data;
    }
    return { patients: [], appointments: [], activity_logs: [] };
  } catch (error) {
    console.error('Error reading from Supabase:', error);
    return { patients: [], appointments: [], activity_logs: [] };
  }
}

// Helper para escribir base de datos JSON a Supabase
async function writeDB(data) {
  try {
    await supabase.from('json_db').upsert({ id: 1, data: data });
  } catch (error) {
    console.error('Error writing to Supabase:', error);
  }
}

// Helper para registrar actividad
async function logActivity(userId, action, ipAddress) {
  try {
    const db = await readDB();
    if (!db.activity_logs) db.activity_logs = [];
    db.activity_logs.push({
      id: Date.now(),
      user_id: userId,
      action,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    });
    await writeDB(db);
  } catch (error) {
    console.error('Error al registrar actividad:', error);
  }
}

// Middleware de Autenticación
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    jwt.verify(bearerToken, process.env.JWT_SECRET || 'fallback_secret', (err, authData) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
      }
      req.user = authData.user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Acceso denegado. Se requiere autenticación.' });
  }
}

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' });

  try {
    if (username === 'Agenda Orientación' && password === 'IEFA2026') {
      const tokenPayload = {
        user: { id: 1, username: username, role: 'admin' }
      };
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '8h' });
      
      await logActivity(1, 'Inicio de sesión exitoso', req.ip);
      res.json({ success: true, token, role: 'admin' });
    } else {
      await logActivity(0, `Intento fallido de login: ${username}`, req.ip);
      res.status(401).json({ error: 'Credenciales inválidas o no autorizadas' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ==========================================
// RUTAS DE LA API REST (Protegidas)
// ==========================================

app.get('/api/appointments', verifyToken, async (req, res) => {
  try {
    const db = await readDB();
    const today = new Date().toISOString().split('T')[0];
    
    // Auto-borrar citas de días que ya pasaron
    const validApps = db.appointments.filter(a => a.date >= today);
    if (validApps.length !== db.appointments.length) {
      db.appointments = validApps;
      await writeDB(db);
    }
    
    // Simular el LEFT JOIN con patients para tener name y document
    const results = db.appointments.map(app => {
      const p = db.patients.find(pat => pat.id === app.patient_id);
      return { ...app, patient_name: p ? p.name : 'Desconocido', document: p ? p.document : '', phone: p ? p.phone : '', email: p ? p.email : '' };
    });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las citas' });
  }
});

app.post('/api/appointments', verifyToken, async (req, res) => {
  const { name, document, phone, email, date, time_start, time_end, modality, reason, is_necessary, allergies } = req.body;
  try {
    const db = await readDB();
    
    // Verificar que no haya solapamiento en el rango de horas
    const timeConflict = db.appointments.some(a => {
      if (a.date !== date || a.status === 'cancelled') return false;
      const existingStart = a.time_start.substring(0, 5);
      const existingEnd = a.time_end ? a.time_end.substring(0, 5) : existingStart;
      const newStart = time_start.substring(0, 5);
      const newEnd = time_end ? time_end.substring(0, 5) : newStart;
      return newStart < existingEnd && newEnd > existingStart;
    });
    if (timeConflict) {
      return res.status(400).json({ error: 'Ya existe una cita agendada para esa misma fecha y hora.' });
    }

    let patient = db.patients.find(p => p.document === document);
    if (patient) {
      const count = db.appointments.filter(a => a.patient_id === patient.id && a.status !== 'cancelled').length;
      if (count >= 2 && !is_necessary) {
        return res.status(400).json({ error: 'El paciente ya tiene 2 citas. Solo se puede agendar más si es necesario.' });
      }
      // Update patient allergies if provided and empty
      if (allergies && !patient.allergies) {
        patient.allergies = allergies;
      }
    } else {
      patient = {
        id: Date.now(),
        name,
        document,
        phone: phone || '',
        email: email || '',
        allergies: allergies || '',
        notes: ''
      };
      db.patients.push(patient);
    }
    
    const appointment = {
      id: Date.now() + 1,
      patient_id: patient.id,
      date,
      time_start,
      time_end,
      modality,
      reason,
      allergies: allergies || patient.allergies || '',
      status: 'pending'
    };
    db.appointments.push(appointment);
    await writeDB(db);
    
    await logActivity(req.user.id, `Creó cita ID: ${appointment.id}`, req.ip);
    res.status(201).json({ success: true, appointmentId: appointment.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la cita' });
  }
});

app.patch('/api/appointments/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const db = await readDB();
    const idx = db.appointments.findIndex(a => String(a.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Cita no encontrada' });
    
    db.appointments[idx].status = status;
    await writeDB(db);
    
    await logActivity(req.user.id, `Actualizó estado cita ID: ${id} a ${status}`, req.ip);
    res.json({ success: true, message: 'Estado actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
});

app.delete('/api/appointments/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const db = await readDB();
    const idx = db.appointments.findIndex(a => String(a.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Cita no encontrada' });
    
    const patientId = db.appointments[idx].patient_id;
    db.appointments.splice(idx, 1);
    
    // Check if patient has any other appointments
    const hasOtherAppointments = db.appointments.some(a => String(a.patient_id) === String(patientId));
    if (!hasOtherAppointments && patientId) {
      db.patients = db.patients.filter(p => String(p.id) !== String(patientId));
    }
    
    await writeDB(db);
    
    await logActivity(req.user.id, `Borrador definitivo cita ID: ${id}`, req.ip);
    res.json({ success: true, message: 'Cita borrada permanentemente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al borrar la cita' });
  }
});

app.get('/api/patients', verifyToken, async (req, res) => {
  try {
    const db = await readDB();
    
    // Auto-limpieza de pacientes sin citas
    const validPatients = db.patients.filter(p => {
      return db.appointments.some(a => String(a.patient_id) === String(p.id));
    });
    
    if (validPatients.length !== db.patients.length) {
      db.patients = validPatients;
      await writeDB(db);
    }
    
    res.json(db.patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los pacientes' });
  }
});

app.put('/api/patients/:id/notes', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  try {
    const db = await readDB();
    const idx = db.patients.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Paciente no encontrado' });
    
    db.patients[idx].notes = notes || '';
    await writeDB(db);
    
    res.json({ success: true, message: 'Ficha actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar ficha' });
  }
});

app.put('/api/patients/:id/info', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { document, phone, email, grade, guardian, allergies } = req.body;
  try {
    const db = await readDB();
    const idx = db.patients.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Paciente no encontrado' });
    
    if (document !== undefined) db.patients[idx].document = document;
    if (phone !== undefined) db.patients[idx].phone = phone;
    if (email !== undefined) db.patients[idx].email = email;
    if (grade !== undefined) db.patients[idx].grade = grade;
    if (guardian !== undefined) db.patients[idx].guardian = guardian;
    if (allergies !== undefined) db.patients[idx].allergies = allergies;
    
    await writeDB(db);
    res.json({ success: true, message: 'Datos actualizados' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar datos' });
  }
});

// ==========================================
// RUTA POR DEFECTO PARA EL FRONTEND
// ==========================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Iniciar servidor
export default app;
});
