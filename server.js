// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'clave_jwt_por_defecto';

// Middlewares
app.use(cors());
app.use(express.json());

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'public')));

// Helper: generar token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// Middleware de autenticación para rutas protegidas
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// ========================
// Inicializar usuario admin
// ========================
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234';

async function initAdminUser() {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [ADMIN_USERNAME]
    );

    if (rows.length > 0) {
      console.log('Usuario admin ya existe');
      return;
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
      [ADMIN_USERNAME, hash, 'owner']
    );

    console.log(`Usuario admin creado (user: ${ADMIN_USERNAME})`);
  } catch (err) {
    console.error('Error creando usuario admin:', err.message);
  }
}

initAdminUser();

// ========================
// Rutas de autenticación
// ========================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken(user);
    return res.json({ token });
  } catch (err) {
    console.error('Error en login:', err.message);
    return res.status(500).json({ error: 'Error de servidor' });
  }
});

// ========================
// Rutas de productos
// ========================

// GET /api/products (público)
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, description, price, stock, image FROM products ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo productos:', err.message);
    res.status(500).json({ error: 'Error obteniendo productos' });
  }
});

// POST /api/products (dueño)
app.post('/api/products', authMiddleware, async (req, res) => {
  const { name, description, price, stock, image } = req.body;

  if (!name || !description || price == null || stock == null) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    const insertQuery = `
      INSERT INTO products (name, description, price, stock, image)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, price, stock, image
    `;

    const { rows } = await pool.query(insertQuery, [
      name,
      description,
      price,
      stock,
      image || null,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creando producto:', err.message);
    res.status(500).json({ error: 'Error creando producto' });
  }
});

// PUT /api/products/:id (dueño)
app.put('/api/products/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image } = req.body;

  try {
    const updateQuery = `
      UPDATE products
      SET name = $1, description = $2, price = $3, stock = $4, image = $5
      WHERE id = $6
      RETURNING id, name, description, price, stock, image
    `;
    // ... resto igual
  } catch (err) {
    // ...
  }

    const { rows } = await pool.query(updateQuery, [
      name,
      description,
      price,
      stock,
      image || null,
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error actualizando producto:', err.message);
    res.status(500).json({ error: 'Error actualizando producto' });
  }
});

// DELETE /api/products/:id (dueño)
app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [
      id,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error eliminando producto:', err.message);
    res.status(500).json({ error: 'Error eliminando producto' });
  }
});

// Fallback: servir index.html en /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
