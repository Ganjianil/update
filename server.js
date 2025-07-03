const express = require("express");
const app = express();
const port = 20158;
const mysql = require("mysql2");
const multer = require("multer");
const upload = multer({ dest: 'upload/' });
const jwt = require("jsonwebtoken");
const easyinvoice = require('easyinvoice');
const fs = require('fs');
const cors = require('cors');
const dotenv = require("dotenv");
const db = require('./db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path'); 


// If your logo is directly in root folder
const logoBase64 = fs.readFileSync(path.join(__dirname, "hp.jpeg"), "base64");






dotenv.config();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Initialize database schema on startup
async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    
    // Test database connection first
    try {
      await db.query('SELECT 1 as test');
      console.log('Database connection successful');
    } catch (connectionError) {
      console.error('Database connection failed:', connectionError);
      return;
    }

    // Create users table if it doesn't exist
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Users table created/verified');
    } catch (err) {
      console.log('Users table setup error:', err.message);
    }

    // Create categories table with all required columns
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          image_path VARCHAR(500),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Categories table created/verified');
      
      // Insert default categories if they don't exist
      const [existingCategories] = await db.query('SELECT COUNT(*) as count FROM categories');
      if (existingCategories[0].count === 0) {
        await db.query(`
          INSERT INTO categories (name, description, is_active) VALUES 
          ('wholesale', 'Bulk products available for wholesale purchase', TRUE),
          ('pre-order', 'Custom manufactured products available for pre-order with metal customization', TRUE)
        `);
        console.log('Default categories inserted');
      }
    } catch (err) {
      console.log('Categories table setup error:', err.message);
    }

    // Add missing columns to categories table if they don't exist
    try {
      await db.query('ALTER TABLE categories ADD COLUMN image_path VARCHAR(500)');
      console.log('Added image_path column to categories table');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.log('Categories image_path column setup:', err.message);
      }
    }

    try {
      await db.query('ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      console.log('Added updated_at column to categories table');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.log('Categories updated_at column setup:', err.message);
      }
    }

    // Create coupons table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS coupons (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          discount_type ENUM('percentage', 'fixed') NOT NULL,
          discount_value DECIMAL(10, 2) NOT NULL,
          min_order_amount DECIMAL(10, 2) DEFAULT 0,
          max_discount DECIMAL(10, 2) DEFAULT NULL,
          expiry_date DATE,
          is_active BOOLEAN DEFAULT TRUE,
          usage_limit INT DEFAULT NULL,
          used_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Coupons table created/verified');
      
      // Insert sample coupons if they don't exist
      const [existingCoupons] = await db.query('SELECT COUNT(*) as count FROM coupons');
      if (existingCoupons[0].count === 0) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 3);
        const expiryDate = futureDate.toISOString().split('T')[0];
        
        await db.query(`
          INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, expiry_date, is_active) VALUES 
          ('WELCOME10', 'Welcome discount for new customers', 'percentage', 10.00, 500.00, ?, TRUE),
          ('BULK20', 'Special discount for bulk orders', 'percentage', 20.00, 2000.00, ?, TRUE),
          ('SAVE500', 'Flat discount on orders above ₹3000', 'fixed', 500.00, 3000.00, ?, TRUE)
        `, [expiryDate, expiryDate, expiryDate]);
        console.log('Sample coupons inserted');
      }
    } catch (err) {
      console.log('Coupons table setup error:', err.message);
    }

    // Create products table with proper boolean column
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_name VARCHAR(255) NOT NULL,
          product_price DECIMAL(10, 2) NOT NULL,
          descripition TEXT,
          category VARCHAR(100) DEFAULT 'wholesale',
          category_id INT,
          is_preorder BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
      `);
      console.log('Products table created/verified');
    } catch (err) {
      console.log('Products table setup error:', err.message);
    }

    // Add category_id column to products table if it doesn't exist
    try {
      await db.query('ALTER TABLE products ADD COLUMN category_id INT');
      console.log('Products table updated with category_id column');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.log('Products table category_id column setup:', err.message);
      }
    }

    // Fix is_preorder column type
    try {
      await db.query('ALTER TABLE products MODIFY COLUMN is_preorder BOOLEAN DEFAULT FALSE');
      console.log('Fixed is_preorder column type');
    } catch (err) {
      console.log('is_preorder column fix:', err.message);
    }

    // Add foreign key constraint for category_id
    try {
      await db.query('ALTER TABLE products ADD FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL');
      console.log('Foreign key constraint added for category_id');
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') {
        console.log('Foreign key constraint setup:', err.message);
      }
    }

    // Migrate existing products to use category_id
    try {
      // Update wholesale products
      await db.query(`
        UPDATE products p 
        JOIN categories c ON c.name = 'wholesale' 
        SET p.category_id = c.id 
        WHERE p.category = 'wholesale' OR (p.category IS NULL AND p.is_preorder = FALSE)
      `);
      
      // Update pre-order products
      await db.query(`
        UPDATE products p 
        JOIN categories c ON c.name = 'pre-order' 
        SET p.category_id = c.id 
        WHERE p.category = 'pre-order' OR p.is_preorder = TRUE
      `);
      
      console.log('Existing products migrated to use category_id');
    } catch (err) {
      console.log('Product migration error:', err.message);
    }

    // Create remaining tables...
    // (Keep all the existing table creation code for other tables)
    
    // Create product_img table if it doesn't exist
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS product_img (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          image_path VARCHAR(500) NOT NULL,
          variant_name VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `);
      console.log('Product_img table created/verified');
    } catch (err) {
      console.log('Product_img table setup error:', err.message);
    }

    // Create product_variants table for different metal types
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS product_variants (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          variant_name VARCHAR(100) NOT NULL,
          variant_type VARCHAR(50) NOT NULL,
          price_multiplier DECIMAL(5, 2) DEFAULT 1.00,
          additional_price DECIMAL(10, 2) DEFAULT 0.00,
          description TEXT,
          is_available BOOLEAN DEFAULT TRUE,
          image_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (image_id) REFERENCES product_img(id) ON DELETE SET NULL
        )
      `);
      console.log('Product_variants table created/verified');
    } catch (err) {
      console.log('Product_variants table setup error:', err.message);
    }

    // Create pre_orders table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS pre_orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          variant_id INT,
          quantity INT DEFAULT 1,
          base_price DECIMAL(10, 2) NOT NULL,
          variant_price DECIMAL(10, 2) NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL,
          advance_amount DECIMAL(10, 2) NOT NULL,
          remaining_amount DECIMAL(10, 2) NOT NULL,
          status ENUM('pending', 'confirmed', 'in_production', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
          estimated_delivery DATE,
          customer_notes TEXT,
          admin_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
        )
      `);
      console.log('Pre_orders table created/verified');
    } catch (err) {
      console.log('Pre_orders table setup error:', err.message);
    }

    // Create cart table if it doesn't exist
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS cart (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `);
      console.log('Cart table created/verified');
    } catch (err) {
      console.log('Cart table setup error:', err.message);
    }

    // Create wishlist table if it doesn't exist
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS wishlist (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          variant_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
          UNIQUE KEY unique_wishlist (user_id, product_id, variant_id)
        )
      `);
      console.log('Wishlist table created/verified');
    } catch (err) {
      console.log('Wishlist table setup error:', err.message);
    }

    // Create orders table if it doesn't exist
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          street TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          zip VARCHAR(20) NOT NULL,
          country VARCHAR(100) DEFAULT 'India',
          total_amount DECIMAL(10, 2) DEFAULT 0,
          status VARCHAR(50) DEFAULT 'processing',
          coupon_id INT,
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
        )
      `);
      console.log('Orders table created/verified');
    } catch (err) {
      console.log('Orders table setup error:', err.message);
    }

    // Create user_coupon_usage table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_coupon_usage (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          coupon_id INT NOT NULL,
          used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
        )
      `);
      console.log('User_coupon_usage table created/verified');
    } catch (err) {
      console.log('User_coupon_usage table setup error:', err.message);
    }

    // Create password_resets table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX(email),
          INDEX(token)
        )
      `);
      console.log('Password_resets table created/verified');
    } catch (err) {
      console.log('Password_resets table setup:', err.message);
    }

    // Ensure order_items table exists with proper structure
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT DEFAULT 1,
          price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `);
      console.log('Order_items table created/verified');
    } catch (err) {
      console.log('Order_items table setup:', err.message);
    }

    // Create photos table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS photos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          image_path VARCHAR(500) NOT NULL,
          original_name VARCHAR(255),
          file_size INT,
          upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Photos table created/verified');
    } catch (err) {
      console.log('Photos table setup:', err.message);
    }

    // Create user_addresses table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_addresses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          street TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          zip VARCHAR(20) NOT NULL,
          country VARCHAR(100) DEFAULT 'India',
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('User_addresses table created/verified');
    } catch (err) {
      console.log('User_addresses table setup:', err.message);
    }

    // Create user_profiles table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          full_name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('User_profiles table created/verified');
    } catch (err) {
      console.log('User_profiles table setup:', err.message);
    }

    // Create rewards table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_rewards (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          points INT DEFAULT 0,
          level VARCHAR(50) DEFAULT 'Bronze',
          total_earned INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('User_rewards table created/verified');
    } catch (err) {
      console.log('User_rewards table setup:', err.message);
    }

    // Create admin_users table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Admin_users table created/verified');
      
      // Create default admin user if not exists
      const [adminExists] = await db.query('SELECT * FROM admin_users WHERE username = ?', ['admin']);
      if (adminExists.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.query('INSERT INTO admin_users (username, password, email) VALUES (?, ?, ?)', 
          ['admin', hashedPassword, 'admin@nandini.com']);
        console.log('Default admin user created: username=admin, password=admin123');
      }
    } catch (err) {
      console.log('Admin_users table setup:', err.message);
    }

    console.log('Database initialization completed successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

initializeDatabase();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();

// NO db.promise()
// Just use:





app.use(express.json());
app.use(
  cors({
    origin: 'https://nandinicraft.netlify.app',
    credentials: true, // Optional: if you’re dealing with cookies or authorization headers
  })
);



app.listen(port, () => {
  console.log(`Server running under ${port}`);
});

app.get("/", (_, res) => {
  res.send("welcome to website");
});

const SECRET = 'your_secret_key';
const ADMIN_SECRET = 'your_admin_secret_key';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied, no token provided' });
  
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

function verifyAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied, no admin token provided' });
  
  jwt.verify(token, ADMIN_SECRET, (err, admin) => {
    if (err) return res.status(403).json({ error: 'Invalid admin token' });
    req.admin = admin;
    next();
  });
}

// Helper function to convert string boolean to actual boolean
function convertToBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
}

// Email notification functions
const sendOrderStatusNotification = async (customerEmail, orderDetails, status) => {
  try {
    console.log(`Attempting to send status notification to ${customerEmail}...`);
    let subject, message;
    
    switch (status) {
      case 'cancelled':
        subject = `Order Cancelled - Order #${orderDetails.orderId}`;
        message = `Your order #${orderDetails.orderId} has been cancelled by the seller. If you have any questions, please contact us.`;
        break;
      case 'delivered':
        subject = `Order Delivered - Order #${orderDetails.orderId}`;
        message = `Your order #${orderDetails.orderId} has been delivered successfully. Thank you for shopping with us!`;
        break;
      case 'shipped':
        subject = `Order Shipped - Order #${orderDetails.orderId}`;
        message = `Your order #${orderDetails.orderId} has been shipped and is on its way to you.`;
        break;
      default:
        subject = `Order Status Update - Order #${orderDetails.orderId}`;
        message = `Your order #${orderDetails.orderId} status has been updated to: ${status}`;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: subject,
      html: `
        <h2>${subject}</h2>
        <p>${message}</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</p>
        <p>Thank you for choosing Nandini Brass & Metal Crafts!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Status notification sent to customer: ${customerEmail} successfully`);
  } catch (error) {
    console.error('Error sending customer notification:', error.message);
    console.error('Full error:', error);
  }
};

// Send order notification to admin
async function sendOrderNotificationToAdmin(orderDetails) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "admin@nandinibrass.com", // Replace with actual admin email
      subject: `New Order Placed - Order #${orderDetails.orderId}`,
      html: `
        <h2>New Order Notification</h2>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Customer:</strong> ${orderDetails.customerName}</p>
        <p><strong>Email:</strong> ${orderDetails.customerEmail}</p>
        <p><strong>Phone:</strong> ${orderDetails.customerPhone}</p>
        <p><strong>Address:</strong> ${orderDetails.address}</p>
        <p><strong>Items:</strong></p>
        <ul>
          ${orderDetails.items
            .map(
              (item) =>
                `<li>${item.product_name} (Qty: ${item.quantity || 1}) - ₹${item.product_price}</li>`
            )
            .join("")}
        </ul>
        ${orderDetails.couponCode ? `<p><strong>Coupon Applied:</strong> ${orderDetails.couponCode}</p>` : ""}
        ${orderDetails.discount ? `<p><strong>Discount:</strong> ₹${orderDetails.discount.toFixed(2)}</p>` : ""}
        <p><strong>Total Amount:</strong> ₹${orderDetails.totalAmount.toFixed(2)}</p>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    console.log("Order notification email sent successfully");
  } catch (err) {
    console.error("Error sending order notification:", err);
  }
}

// CATEGORY MANAGEMENT ENDPOINTS

// Get all categories
app.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT c.*, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      GROUP BY c.id 
      ORDER BY c.created_at DESC
    `);
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get active categories only
app.get('/categories/active', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT c.*, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      WHERE c.is_active = TRUE 
      GROUP BY c.id 
      ORDER BY c.name
    `);
    res.json(categories);
  } catch (err) {
    console.error('Error fetching active categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new category
app.post('/admin/categories', upload.single('image'), async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const image_path = req.file ? req.file.path : null;
    const isActiveBoolean = convertToBoolean(is_active);
    
    const [result] = await db.query(`
      INSERT INTO categories (name, description, image_path, is_active) 
      VALUES (?, ?, ?, ?)
    `, [name.trim(), description || '', image_path, isActiveBoolean]);

    res.json({ 
      message: 'Category created successfully', 
      categoryId: result.insertId 
    });
  } catch (err) {
    console.error('Error creating category:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Category name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

// Update category
app.put('/admin/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, description, is_active } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const isActiveBoolean = convertToBoolean(is_active);
    
    let updateQuery = `
      UPDATE categories 
      SET name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    `;
    let queryParams = [name.trim(), description || '', isActiveBoolean];

    if (req.file) {
      updateQuery += `, image_path = ?`;
      queryParams.push(req.file.path);
    }

    updateQuery += ` WHERE id = ?`;
    queryParams.push(categoryId);

    const [result] = await db.query(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully' });
  } catch (err) {
    console.error('Error updating category:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Category name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
});

// Delete category
app.delete('/admin/categories/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Check if category has products
    const [products] = await db.query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [categoryId]);
    
    if (products[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing products. Please move or delete products first.' 
      });
    }

    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// COUPON MANAGEMENT ENDPOINTS

// Get all coupons
app.get('/admin/coupons', async (req, res) => {
  try {
    const [coupons] = await db.query(`
      SELECT * FROM coupons 
      ORDER BY created_at DESC
    `);
    res.json(coupons);
  } catch (err) {
    console.error('Error fetching coupons:', err);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Get active coupons for frontend display
app.get('/coupons/active', async (req, res) => {
  try {
    const [coupons] = await db.query(`
      SELECT code, description, discount_type, discount_value, min_order_amount, expiry_date 
      FROM coupons 
      WHERE is_active = TRUE AND (expiry_date IS NULL OR expiry_date >= CURDATE())
      AND (usage_limit IS NULL OR used_count < usage_limit)
      ORDER BY created_at DESC
    `);
    res.json(coupons);
  } catch (err) {
    console.error('Error fetching active coupons:', err);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Create new coupon
app.post('/admin/coupons', async (req, res) => {
  try {
    const { 
      code, description, discount_type, discount_value, 
      min_order_amount, max_discount, expiry_date, 
      is_active, usage_limit 
    } = req.body;
    
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }
    
    if (!discount_type || !discount_value) {
      return res.status(400).json({ error: 'Discount type and value are required' });
    }

    const isActiveBoolean = convertToBoolean(is_active);

    const [result] = await db.query(`
      INSERT INTO coupons (
        code, description, discount_type, discount_value, 
        min_order_amount, max_discount, expiry_date, 
        is_active, usage_limit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code.trim().toUpperCase(), description || '', discount_type, 
      discount_value, min_order_amount || 0, max_discount || null, 
      expiry_date || null, isActiveBoolean, usage_limit || null
    ]);

    res.json({ 
      message: 'Coupon created successfully', 
      couponId: result.insertId 
    });
  } catch (err) {
    console.error('Error creating coupon:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Coupon code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create coupon' });
    }
  }
});

// Update coupon
app.put('/admin/coupons/:id', async (req, res) => {
  try {
    const couponId = req.params.id;
    const { 
      code, description, discount_type, discount_value, 
      min_order_amount, max_discount, expiry_date, 
      is_active, usage_limit 
    } = req.body;
    
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const isActiveBoolean = convertToBoolean(is_active);

    const [result] = await db.query(`
      UPDATE coupons SET 
        code = ?, description = ?, discount_type = ?, discount_value = ?, 
        min_order_amount = ?, max_discount = ?, expiry_date = ?, 
        is_active = ?, usage_limit = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      code.trim().toUpperCase(), description || '', discount_type, 
      discount_value, min_order_amount || 0, max_discount || null, 
      expiry_date || null, isActiveBoolean, usage_limit || null, 
      couponId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({ message: 'Coupon updated successfully' });
  } catch (err) {
    console.error('Error updating coupon:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Coupon code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update coupon' });
    }
  }
});

// Delete coupon
app.delete('/admin/coupons/:id', async (req, res) => {
  try {
    const couponId = req.params.id;
    const [result] = await db.query('DELETE FROM coupons WHERE id = ?', [couponId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error('Error deleting coupon:', err);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// ADMIN AUTHENTICATION ENDPOINTS
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Admin login attempt:', { username, password }); // Log both fields

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const [results] = await db.query(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    );
    console.log('Database query results:', results); // Log query results

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const admin = results[0];
    const match = await bcrypt.compare(password, admin.password);
    console.log('Password match result:', match); // Log password comparison

    if (!match) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, ADMIN_SECRET, { expiresIn: '24h' });
    console.log('Admin login successful, token generated');

    res.json({
      message: 'Admin login successful',
      token,
      admin: { id: admin.id, username: admin.username, email: admin.email }
    });
  } catch (err) {
    console.error('Admin login error:', err.message, err.stack);
    res.status(500).json({ error: 'Admin login failed. Please try again.' });
  }
});
app.post('/admin/register', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ADMIN_SECRET);
    console.log('Admin register request by:', decoded.username);

    // Check if the requesting admin exists and has permission (e.g., is super admin)
    const [adminResults] = await db.query(
      'SELECT * FROM admin_users WHERE id = ? AND is_super_admin = 1',
      [decoded.id]
    );
    if (adminResults.length === 0) {
      return res.status(403).json({ error: 'Permission denied. Only super admins can create users.' });
    }

    // Extract new admin details from request body
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    // Check if username or email already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM admin_users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new admin into database
    const [result] = await db.query(
      'INSERT INTO admin_users (username, password, email, is_super_admin) VALUES (?, ?, ?, 0)',
      [username, hashedPassword, email]
    );
    console.log('New admin created with ID:', result.insertId);

    res.status(201).json({
      message: 'Admin user created successfully',
      admin: { id: result.insertId, username, email }
    });
  } catch (err) {
    console.error('Admin register error:', err.message, err.stack);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Failed to create admin user. Please try again.' });
  }
});

// Test email endpoint
app.post('/test-email', async (req, res) => {
  try {
    console.log('Testing email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

    const { to, subject, message } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to || 'anilrocky519@gmail.com',
      subject: subject || 'Test Email from Nandini Crafts',
      html: `
        <h2>Test Email</h2>
        <p>${message || 'This is a test email to verify email functionality.'}</p>
        <p>If you receive this email, the email service is working correctly!</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully');
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// User authentication endpoints with better error handling
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('Signup attempt:', { username, email });

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const [existingUser] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this username or email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashed]
    );

    // Create initial rewards record
    try {
      await db.query('INSERT INTO user_rewards (user_id, points) VALUES (?, ?)', [result.insertId, 100]);
    } catch (rewardErr) {
      console.log('Reward creation error (non-critical):', rewardErr.message);
    }

    console.log('User registered successfully:', { id: result.insertId, username, email });
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if login is with email or username
    const [results] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (results.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '24h' });
    console.log('Login successful:', { id: user.id, username: user.username });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// PRODUCT ENDPOINTS WITH CATEGORY SUPPORT

// Modified: Create product with category_id and proper boolean handling
app.post('/products', upload.array('images'), async (req, res) => {
  try {
    const { product_name, product_price, descripition, category_id, is_preorder } = req.body;
    console.log('Adding product:', { product_name, product_price, descripition, category_id, is_preorder });

    if (!product_name || !product_price) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    if (!category_id) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Convert is_preorder to proper boolean
    const isPreorderBoolean = convertToBoolean(is_preorder);

    const [result] = await db.query(
      `INSERT INTO products (product_name, product_price, descripition, category_id, is_preorder) VALUES (?, ?, ?, ?, ?)`,
      [product_name, product_price, descripition || '', category_id, isPreorderBoolean]
    );

    const product_id = result.insertId;

    if (req.files && req.files.length > 0) {
      const imageinsert = req.files.map(file => [product_id, file.path]);
      await db.query(
        `INSERT INTO product_img (product_id, image_path) VALUES ?`,
        [imageinsert]
      );
    }

    // If it's a preorder product, add default variants
    if (isPreorderBoolean) {
      const variants = [
        [product_id, 'Brass', 'metal', 1.00, 0.00, 'Traditional brass finish with golden appearance'],
        [product_id, 'Silver', 'metal', 1.50, 500.00, 'Premium silver plating with elegant shine'],
        [product_id, 'Copper', 'metal', 1.25, 200.00, 'Antique copper finish with rustic appeal']
      ];
      await db.query(`
        INSERT INTO product_variants (product_id, variant_name, variant_type, price_multiplier, additional_price, description)
        VALUES ?
      `, [variants]);
    }

    console.log('Product added successfully:', { id: product_id, product_name });
    res.json({ message: 'Products with images saved successfully' });
  } catch (err) {
    console.error('Product creation error:', err);
    res.status(500).json({ error: 'Failed to save product' });
  }
});


// Modified: Get products by category_id with proper image handling
app.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log('Fetching products for category ID:', categoryId);
    
    // First get all products for the category
    const [products] = await db.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.category_id = ?
       ORDER BY p.id DESC`,
      [categoryId]
    );

    // Then get all images for these products
    const productIds = products.map(p => p.id);
    let images = [];
    
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const [imageResults] = await db.query(
        `SELECT product_id, image_path FROM product_img WHERE product_id IN (${placeholders})`,
        productIds
      );
      images = imageResults;
    }

    // Combine products with their images (taking the first image for each product)
    const productsWithImages = products.map(product => {
      const productImages = images.filter(img => img.product_id === product.id);
      return {
        ...product,
        image_path: productImages.length > 0 ? productImages[0].image_path : null,
        all_images: productImages.map(img => img.image_path) // Include all images if needed
      };
    });

    console.log(`Found ${productsWithImages.length} products for category ID ${categoryId}`);
    console.log('Products with images:', productsWithImages.map(p => ({
      id: p.id,
      name: p.product_name,
      image_path: p.image_path
    })));
    
    res.json(productsWithImages);
  } catch (err) {
    console.error('Product fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get products by category (legacy support)
app.get('/products/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    console.log('Fetching products for category:', category);

    const [results] = await db.query(
      `SELECT p.*, pi.image_path 
       FROM products p
       LEFT JOIN product_img pi ON p.id = pi.product_id
       WHERE p.category = ?
       ORDER BY p.id DESC`,
      [category]
    );

    console.log(`Found ${results.length} products for category ${category}`);
    res.json(results);
  } catch (err) {
    console.error('Product fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Modified: Get all products with category info
// Replace the existing static file serving lines
app.use('/upload', express.static(path.join(__dirname, 'upload')));
// Remove or comment out: app.use('/images', express.static(path.join(__dirname, 'uploads')));

// In the /viewproducts endpoint, add logging
app.get('/viewproducts', async (_, res) => {
  try {
    console.log('Fetching all products...');
    
    const [products] = await db.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.id DESC`
    );

    const productIds = products.map(p => p.id);
    let images = [];
    
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const [imageResults] = await db.query(
        `SELECT product_id, image_path FROM product_img WHERE product_id IN (${placeholders})`,
        productIds
      );
      images = imageResults;
    }

    const productsWithImages = products.map(product => {
      const productImages = images.filter(img => img.product_id === product.id);
      const result = {
        ...product,
        image_path: productImages.length > 0 ? productImages[0].image_path : null,
        all_images: productImages.map(img => img.image_path)
      };
      console.log('Sending product with image_path:', result.image_path); // Debug log
      return result;
    });

    console.log(`Found ${productsWithImages.length} products`);
    res.json(productsWithImages);
  } catch (err) {
    console.error('Product fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});
app.get('/viewproducts/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    console.log(`Fetching product with ID: ${productId}`);

    const [products] = await db.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [productId]
    );

    if (products.length === 0) {
      console.log(`Product with ID ${productId} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];

    const [imageResults] = await db.query(
      `SELECT product_id, image_path FROM product_img WHERE product_id = ?`,
      [productId]
    );
    const images = imageResults;

    const productWithImages = {
      ...product,
      image_path: images.length > 0 ? images[0].image_path : null,
      all_images: images.map(img => img.image_path)
    };

    console.log(`Found product:`, productWithImages);
    res.json(productWithImages);
  } catch (err) {
    console.error('Product fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});
app.post('/addtocart', async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const token = req.headers.authorization?.split(' ')[1]; // Extract token

    // Validate input
    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid product ID or quantity' });
    }

    // Verify token (simple check; implement proper JWT validation)
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Example: Check if product exists (use your product table)
    const [products] = await db.query('SELECT id FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Example: Add to cart (assuming a cart table with user_id and product_id)
    const userId = 1; // Replace with token-decoded user ID
    await db.query(
      'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?',
      [userId, product_id, quantity, quantity]
    );

    res.json({ message: 'Product added to cart successfully' });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Failed to add product to cart' });
  }
});

app.delete('/deleteproducts/:id', async (req, res) => {
  try {
    const product_id = req.params.id;
    console.log('Deleting product:', product_id);

    if (!product_id || isNaN(product_id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Delete variants first
    await db.query(`DELETE FROM product_variants WHERE product_id = ?`, [product_id]);
    await db.query(`DELETE FROM product_img WHERE product_id = ?`, [product_id]);
    const [result] = await db.query(`DELETE FROM products WHERE id = ?`, [product_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Product deleted successfully:', product_id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Product deletion error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.delete('/deleteallproducts', async (_, res) => {
  try {
    console.log('Deleting all products');
    await db.query('DELETE FROM product_variants');
    await db.query('DELETE FROM product_img');
    await db.query('DELETE FROM products');
    console.log('All products deleted successfully');
    res.json({ message: 'All products and their images deleted successfully' });
  } catch (err) {
    console.error('Delete all products error:', err);
    res.status(500).json({ error: 'Failed to delete all products' });
  }
});

// Continue with all the remaining endpoints from the previous server.js file...
// (I'll include the rest of the endpoints to maintain functionality)

// PRE-ORDER ENDPOINTS
app.post('/preorder', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, variant_id, quantity, customer_notes } = req.body;
    console.log('Pre-order request:', { userId, product_id, variant_id, quantity });

    if (!product_id || !variant_id || !quantity) {
      return res.status(400).json({ error: 'Product ID, variant ID, and quantity are required' });
    }

    // Get product details
    const [product] = await db.query('SELECT * FROM products WHERE id = ?', [product_id]);
    if (product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get variant details
    const [variant] = await db.query('SELECT * FROM product_variants WHERE id = ? AND product_id = ?', [variant_id, product_id]);
    if (variant.length === 0) {
      return res.status(404).json({ error: 'Product variant not found' });
    }

    const basePrice = parseFloat(product[0].product_price);
    const variantPrice = basePrice * parseFloat(variant[0].price_multiplier) + parseFloat(variant[0].additional_price);
    const totalPrice = variantPrice * parseInt(quantity);
    const advanceAmount = totalPrice * 0.20; // 20% advance
    const remainingAmount = totalPrice - advanceAmount;

    // Calculate estimated delivery (30 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 30);

    const [result] = await db.query(`
      INSERT INTO pre_orders (
        user_id, product_id, variant_id, quantity, base_price, variant_price,
        total_price, advance_amount, remaining_amount, estimated_delivery, customer_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            userId, product_id, variant_id, quantity, basePrice, variantPrice,
      totalPrice, advanceAmount, remainingAmount, estimatedDelivery, customer_notes || ''
    ]);

    res.json({
      message: 'Pre-order placed successfully',
      preOrderId: result.insertId,
      totalPrice: totalPrice,
      advanceAmount: advanceAmount,
      remainingAmount: remainingAmount,
      estimatedDelivery: estimatedDelivery
    });
  } catch (err) {
    console.error('Pre-order error:', err);
    res.status(500).json({ error: 'Failed to place pre-order' });
  }
});

// Get user's pre-orders
app.get('/mypreorders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [preOrders] = await db.query(`
      SELECT
        po.*,
        p.product_name,
        p.descripition,
        pv.variant_name,
        pv.description as variant_description,
        pi.image_path
      FROM pre_orders po
      JOIN products p ON po.product_id = p.id
      LEFT JOIN product_variants pv ON po.variant_id = pv.id
      LEFT JOIN product_img pi ON p.id = pi.product_id
      WHERE po.user_id = ?
      ORDER BY po.created_at DESC
    `, [userId]);

    res.json(preOrders);
  } catch (err) {
    console.error('Error fetching pre-orders:', err);
    res.status(500).json({ error: 'Failed to fetch pre-orders' });
  }
});

// Admin: Get all pre-orders
app.get('/admin/preorders', async (_, res) => {
  try {
    const [preOrders] = await db.query(`
      SELECT
        po.*,
        p.product_name,
        pv.variant_name,
        u.username as customer_name,
        u.email as customer_email
      FROM pre_orders po
      JOIN products p ON po.product_id = p.id
      LEFT JOIN product_variants pv ON po.variant_id = pv.id
      JOIN users u ON po.user_id = u.id
      ORDER BY po.created_at DESC
    `);

    res.json(preOrders);
  } catch (err) {
    console.error('Error fetching admin pre-orders:', err);
    res.status(500).json({ error: 'Failed to fetch pre-orders' });
  }
});

// Admin: Update pre-order status
app.put('/admin/preorders/:id/status', async (req, res) => {
  try {
    const preOrderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'in_production', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const [result] = await db.query(
      'UPDATE pre_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, preOrderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pre-order not found' });
    }

    res.json({ message: `Pre-order ${preOrderId} status updated to ${status}` });
  } catch (err) {
    console.error('Error updating pre-order status:', err);
    res.status(500).json({ error: 'Failed to update pre-order status' });
  }
});

// Admin: Delete specific pre-order
app.delete('/admin/preorders/:id', async (req, res) => {
  try {
    const preOrderId = req.params.id;
    const [result] = await db.query('DELETE FROM pre_orders WHERE id = ?', [preOrderId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pre-order not found' });
    }

    res.json({ message: 'Pre-order deleted successfully' });
  } catch (err) {
    console.error('Error deleting pre-order:', err);
    res.status(500).json({ error: 'Failed to delete pre-order' });
  }
});

// Admin: Delete all pre-orders
app.delete('/admin/preorders/all', async (_, res) => {
  try {
    await db.query('DELETE FROM pre_orders');
    res.json({ message: 'All pre-orders deleted successfully' });
  } catch (err) {
    console.error('Error deleting all pre-orders:', err);
    res.status(500).json({ error: 'Failed to delete all pre-orders' });
  }
});

// WISHLIST ENDPOINTS WITH VARIANT SUPPORT
// WISHLIST ENDPOINTS WITH VARIANT SUPPORT - FIXED
app.post('/wishlist', verifyToken, async (req, res) => {
  try {
    const { product_id, variant_id } = req.body;
    const user_id = req.user.id;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const [existing] = await db.query(
      'SELECT * FROM wishlist WHERE user_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))',
      [user_id, product_id, variant_id || null, variant_id || null]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    await db.query('INSERT INTO wishlist (user_id, product_id, variant_id) VALUES (?, ?, ?)', 
      [user_id, product_id, variant_id || null]);

    res.json({ message: 'Product added to wishlist' });
  } catch (err) {
    console.error('Wishlist add error:', err);
    res.status(500).json({ error: 'Failed to add product to wishlist' });
  }
});

app.get('/wishlist', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Updated query with better error handling
    const [results] = await db.query(`
      SELECT 
        w.id, 
        w.product_id,
        w.variant_id,
        p.product_name, 
        p.product_price, 
        p.descripition,
        pi.image_path, 
        pv.variant_name, 
        pv.variant_type, 
        pv.price_multiplier, 
        pv.additional_price,
        pv.description as variant_description
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN product_img pi ON p.id = pi.product_id
      LEFT JOIN product_variants pv ON w.variant_id = pv.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [userId]);

    console.log(`Found ${results.length} wishlist items for user ${userId}`);
    res.json(results);
  } catch (err) {
    console.error('Wishlist fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist items' });
  }
});

app.delete('/wishlist/:item_id', verifyToken, async (req, res) => {
  try {
    const itemId = req.params.item_id;
    const userId = req.user.id;

    if (!itemId || isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    const [result] = await db.query(
      'DELETE FROM wishlist WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    console.log(`Wishlist item ${itemId} removed for user ${userId}`);
    res.json({ message: 'Item removed from wishlist successfully' });
  } catch (err) {
    console.error('Wishlist remove error:', err);
    res.status(500).json({ error: 'Failed to remove wishlist item' });
  }
});

app.delete('/wishlist/clear', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [result] = await db.query('DELETE FROM wishlist WHERE user_id = ?', [userId]);
    
    console.log(`Cleared ${result.affectedRows} wishlist items for user ${userId}`);
    res.json({ message: 'Wishlist cleared successfully' });
  } catch (err) {
    console.error('Wishlist clear error:', err);
    res.status(500).json({ error: 'Failed to clear wishlist' });
  }
});

// Forgot password endpoint
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'No user found with this email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await db.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [email, resetToken, expiresAt]
    );

    // Send reset email
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      
      to: email,
      subject: 'Password Reset Request - Nandini Brass & Metal Crafts',
      html: `
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset email sent successfully' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

// Reset password endpoint
app.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Check if token is valid and not expired
    const [resetRequests] = await db.query(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (resetRequests.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetRequest = resetRequests[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, resetRequest.email]
    );

    // Delete used reset token
    await db.query('DELETE FROM password_resets WHERE token = ?', [token]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// USER PROFILE ENDPOINTS
app.get('/user/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [userResult] = await db.query(`
      SELECT u.username, u.email, up.full_name, up.phone
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?
    `, [userId]);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userResult[0]);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.put('/user/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, phone, full_name } = req.body;

    // Update username and email in users table
    await db.query('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId]);

    // Update or insert profile data
    await db.query(`
      INSERT INTO user_profiles (user_id, full_name, phone)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
      full_name = VALUES(full_name),
      phone = VALUES(phone)
    `, [userId, full_name, phone]);

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// USER ADDRESSES ENDPOINTS
app.get('/user/addresses', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [addresses] = await db.query(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    res.json(addresses);
  } catch (err) {
    console.error('Error fetching addresses:', err);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

app.post('/user/addresses', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, street, city, zip, country, is_default } = req.body;

    // If this is set as default, unset other defaults
    if (is_default) {
      await db.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
    }

    await db.query(`
      INSERT INTO user_addresses (user_id, name, phone, street, city, zip, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, name, phone, street, city, zip, country || 'India', is_default]);

    res.json({ message: 'Address added successfully' });
  } catch (err) {
    console.error('Error adding address:', err);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

app.put('/user/addresses/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    const { name, phone, street, city, zip, country, is_default } = req.body;

    // If this is set as default, unset other defaults
    if (is_default) {
      await db.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
    }

    const [result] = await db.query(`
      UPDATE user_addresses
      SET name = ?, phone = ?, street = ?, city = ?, zip = ?, country = ?, is_default = ?
      WHERE id = ? AND user_id = ?
    `, [name, phone, street, city, zip, country, is_default, addressId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address updated successfully' });
  } catch (err) {
    console.error('Error updating address:', err);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

app.delete('/user/addresses/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const [result] = await db.query(
      'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (err) {
    console.error('Error deleting address:', err);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// USER REWARDS ENDPOINTS
app.get('/user/rewards', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let [rewards] = await db.query('SELECT * FROM user_rewards WHERE user_id = ?', [userId]);

    if (rewards.length === 0) {
      // Create initial rewards record
      await db.query('INSERT INTO user_rewards (user_id) VALUES (?)', [userId]);
      rewards = [{ points: 0, level: 'Bronze', total_earned: 0 }];
    }

    res.json(rewards[0]);
  } catch (err) {
    console.error('Error fetching rewards:', err);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// CART ENDPOINTS
app.post('/cart', verifyToken, async (req, res) => {
  try {
    const { product_id } = req.body;
    const user_id = req.user.id;

    if (!Array.isArray(product_id)) {
      return res.status(400).json({ error: 'product_id must be an array' });
    }

    try {
      const values = product_id.map(pid => [user_id, pid, 1]);
      await db.query('INSERT INTO cart (user_id, product_id, quantity) VALUES ?', [values]);
    } catch (quantityErr) {
      if (quantityErr.message.includes('quantity')) {
        const values = product_id.map(pid => [user_id, pid]);
        await db.query('INSERT INTO cart (user_id, product_id) VALUES ?', [values]);
      } else {
        throw quantityErr;
      }
    }

    res.json({ message: 'Products added to cart for authenticated user' });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Failed to add products to cart' });
  }
});

app.get('/viewcart', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    try {
      const [results] = await db.query(
        `SELECT c.id, p.product_name, p.product_price, p.descripition,
         COALESCE(c.quantity, 1) as quantity
         FROM cart c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?`,
        [userId]
      );
      res.json(results);
    } catch (quantityErr) {
      if (quantityErr.message.includes('quantity')) {
        const [results] = await db.query(
          `SELECT c.id, p.product_name, p.product_price, p.descripition,
           1 as quantity
           FROM cart c
           JOIN products p ON c.product_id = p.id
           WHERE c.user_id = ?`,
          [userId]
        );
        res.json(results);
      } else {
        throw quantityErr;
      }
    }
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Failed to fetch cart items', details: err.message });
  }
});

app.delete('/cart/item/:item_id', verifyToken, async (req, res) => {
  try {
    const itemId = req.params.item_id;
    const userId = req.user.id;

    const [result] = await db.query(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart successfully' });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

app.delete('/cart/clear', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    res.json({ message: 'Cart cleared successfully' });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// COUPON APPLICATION ENDPOINTS

// Validate and apply coupon (User)
app.post("/apply-coupon", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { coupon_code, category } = req.body;

    if (!coupon_code) {
      return res.status(400).json({ error: "Coupon code is required" });
    }

    const [coupons] = await db.query(
      `SELECT * FROM coupons WHERE code = ? AND is_active = TRUE 
       AND (expiry_date IS NULL OR expiry_date > NOW())
       `,
      [coupon_code.toUpperCase(), category || null]
    );

    if (coupons.length === 0) {
      return res.status(404).json({ error: "Invalid or expired coupon" });
    }

    const coupon = coupons[0];

    // Check if user has already used this coupon
    const [usage] = await db.query(
      `SELECT COUNT(*) as use_count FROM user_coupon_usage 
       WHERE user_id = ? AND coupon_id = ?`,
      [userId, coupon.id]
    );

    if (usage[0].use_count >= coupon.max_uses) {
      return res.status(400).json({ error: "Coupon has already been used" });
    }

    res.json({
      message: "Coupon applied successfully",
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
    });
  } catch (err) {
    console.error("Coupon application error:", err);
    res.status(500).json({ error: "Failed to apply coupon" });
  }
});

// CHECKOUT ENDPOINT - UPDATED WITH COUPON SUPPORT
app.post("/checkout", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { address, coupon_code, product_ids, action_type } = req.body;

    if (!address || !address.name || !address.email || !address.phone || 
        !address.street || !address.city || !address.zip) {
      return res.status(400).json({
        error: "Missing required address details",
        required: ["name", "email", "phone", "street", "city", "zip"],
      });
    }

    let itemsToCheckout;
    let shouldClearCart = false;

    if (action_type === "buy_now" && product_ids && product_ids.length > 0) {
      // Buy Now: Process only the specified product_ids
      const [products] = await db.query(
        `SELECT id as product_id, product_name, product_price, category, 1 as quantity 
         FROM products WHERE id IN (?)`,
        [product_ids]
      );
      if (products.length !== product_ids.length) {
        return res.status(400).json({ error: "One or more products not found" });
      }
      itemsToCheckout = products;
    } else {
      // Cart Checkout: Process all cart items
      const [cartItems] = await db.query(
        `SELECT c.product_id, p.product_name, p.product_price, p.category, COALESCE(c.quantity, 1) as quantity
         FROM cart c JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?`,
        [userId]
      );
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }
      itemsToCheckout = cartItems;
      shouldClearCart = true;
    }

    let totalAmount = itemsToCheckout.reduce((total, item) => {
      return total + parseFloat(item.product_price) * (item.quantity || 1);
    }, 0);

    let discount = 0;
    let couponId = null;

    // Apply coupon if provided
    if (coupon_code) {
      const category = itemsToCheckout[0].category; // Assuming all items are from the same category
      const [coupons] = await db.query(
        `SELECT * FROM coupons WHERE code = ? AND is_active = TRUE 
         AND (expiry_date IS NULL OR expiry_date > NOW())
         AND (category IS NULL OR category = ?)`,
        [coupon_code.toUpperCase(), category]
      );

      if (coupons.length === 0) {
        return res.status(400).json({ error: "Invalid or expired coupon" });
      }

      const coupon = coupons[0];

      // Check if user has already used this coupon
      const [usage] = await db.query(
        `SELECT COUNT(*) as use_count FROM user_coupon_usage 
         WHERE user_id = ? AND coupon_id = ?`,
        [userId, coupon.id]
      );

      if (usage[0].use_count >= coupon.max_uses) {
        return res.status(400).json({ error: "Coupon has already been used" });
      }

      // Calculate discount
      if (coupon.discount_type === "percentage") {
        discount = (totalAmount * coupon.discount_value) / 100;
      } else if (coupon.discount_type === "fixed") {
        discount = Math.min(coupon.discount_value, totalAmount); // Discount cannot exceed total
      }

      couponId = coupon.id;
    }

    const finalAmount = totalAmount - discount;

    // Insert order
    const [orderResult] = await db.query(
      `INSERT INTO orders (user_id, name, email, phone, street, city, zip, country, total_amount, status, coupon_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        address.name,
        address.email,
        address.phone,
        address.street,
        address.city,
        address.zip,
        address.country || "India",
        finalAmount,
        "processing",
        couponId,
      ]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    const orderItems = itemsToCheckout.map((item) => [
      orderId,
      item.product_id,
      item.quantity || 1,
      parseFloat(item.product_price),
    ]);

    await db.query(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
      [orderItems]
    );

    // Record coupon usage if applied
    if (couponId) {
      await db.query(
        "INSERT INTO user_coupon_usage (user_id, coupon_id) VALUES (?, ?)",
        [userId, couponId]
      );
    }

    // Add reward points (1 point per rupee spent)
    try {
      await db.query(`
        INSERT INTO user_rewards (user_id, points, total_earned)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        points = points + VALUES(points),
        total_earned = total_earned + VALUES(total_earned)
      `, [userId, Math.floor(finalAmount), Math.floor(finalAmount)]);
    } catch (rewardErr) {
      console.log('Reward update error (non-critical):', rewardErr.message);
    }

    // Clear cart only for cart checkout
    if (shouldClearCart) {
      await db.query("DELETE FROM cart WHERE user_id = ?", [userId]);
    }

    // Send email notification
    const orderDetails = {
      orderId,
      customerName: address.name,
      customerEmail: address.email,
      customerPhone: address.phone,
      totalAmount: finalAmount,
      discount: discount,
      couponCode: coupon_code || null,
      address: `${address.street}, ${address.city}, ${address.zip}, ${address.country}`,
      items: itemsToCheckout,
    };

    await sendOrderNotificationToAdmin(orderDetails);

    res.json({
      message: "Order placed successfully",
      orderId,
      totalAmount: finalAmount,
      discount,
      orderDetails: {
        name: address.name,
        email: address.email,
        phone: address.phone,
        address: `${address.street}, ${address.city}, ${address.zip}, ${address.country}`,
      },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Checkout failed", details: err.message });
  }
});
// Get user orders
app.get('/myorders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const queries = [
      `SELECT
        o.id AS order_id,
        o.order_date,
        o.status,
        o.total_amount,
        o.name,
        o.email,
        o.phone,
        o.street,
        o.city,
        o.zip,
        o.country,
        p.product_name,
        p.product_price,
        oi.quantity,
        oi.price
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ?
       ORDER BY o.order_date DESC`,
      `SELECT
        o.id AS order_id,
        o.order_date,
        o.status,
        0 as total_amount,
        o.name,
        o.email,
        o.phone,
        o.street,
        o.city,
        o.zip,
        o.country,
        p.product_name,
        p.product_price,
        oi.quantity,
        oi.price
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ?
       ORDER BY o.order_date DESC`,
      `SELECT
        o.id AS order_id,
        o.order_date,
        o.status,
        0 as total_amount,
        o.name,
        o.email,
        o.phone,
        o.street,
        o.city,
        o.zip,
        o.country,
        p.product_name,
        p.product_price,
        1 as quantity,
        p.product_price as price
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ?
       ORDER BY o.order_date DESC`
    ];

    for (let i = 0; i < queries.length; i++) {
      try {
        const [results] = await db.query(queries[i], [userId]);
        return res.json(results);
      } catch (queryErr) {
        console.log(`Query ${i + 1} failed:`, queryErr.message);
        if (i === queries.length - 1) {
          throw queryErr;
        }
      }
    }
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: Get all orders
app.get('/admin/orders', async (_, res) => {
  try {
    const queries = [
      `SELECT
        o.id AS order_id,
        o.order_date,
        o.status,
        o.total_amount,
        o.name,
        o.email,
        o.phone,
        o.street,
        o.city,
        o.zip,
        o.country,
        u.username,
        p.product_name,
        p.product_price,
        oi.quantity,
        oi.price
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       ORDER BY o.order_date DESC`,
      `SELECT
        o.id AS order_id,
        o.order_date,
        o.status,
        0 as total_amount,
        o.name,
        o.email,
        o.phone,
        o.street,
        o.city,
        o.zip,
        o.country,
        u.username,
        p.product_name,
        p.product_price,
        oi.quantity,
        oi.price
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       ORDER BY o.order_date DESC`,
      `SELECT
        o.id AS order_id,
        o.order_date,
        o.status,
        0 as total_amount,
        o.name,
        o.email,
        o.phone,
        o.street,
        o.city,
        o.zip,
        o.country,
        u.username,
        p.product_name,
        p.product_price,
        1 as quantity,
        p.product_price as price
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       ORDER BY o.order_date DESC`
    ];

    for (let i = 0; i < queries.length; i++) {
      try {
        const [results] = await db.query(queries[i]);
        return res.json(results);
      } catch (queryErr) {
        console.log(`Admin query ${i + 1} failed:`, queryErr.message);
        if (i === queries.length - 1) {
          throw queryErr;
        }
      }
    }
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Failed to fetch admin orders' });
  }
});

// Update order status - ENHANCED WITH EMAIL NOTIFICATIONS
app.put('/order/:order_id/status', async (req, res) => {
  try {
    const orderId = req.params.order_id;
    const { status } = req.body;

    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Get order details for email notification
    const [orderDetails] = await db.query(
      'SELECT email, total_amount FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderDetails.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Send email notification to customer
    const emailOrderDetails = {
      orderId: orderId,
      totalAmount: orderDetails[0].total_amount || 0
    };
    await sendOrderStatusNotification(orderDetails[0].email, emailOrderDetails, status);

    res.json({ message: `Order ${orderId} status updated to ${status}` });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ORDER CANCELLATION ENDPOINT
app.put('/order/:order_id/cancel', verifyToken, async (req, res) => {
  try {
    const orderId = req.params.order_id;
    const userId = req.user.id;

    // Check if order belongs to user and can be cancelled
    const [orderCheck] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status IN ("processing", "pending")',
      [orderId, userId]
    );

    if (orderCheck.length === 0) {
      return res.status(400).json({ error: 'Order cannot be cancelled or not found' });
    }

    // Update order status
    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['cancelled', orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Failed to update order status' });
    }

    // Send notification to customer
    const orderDetails = {
      orderId: orderId,
      totalAmount: orderCheck[0].total_amount || 0
    };
    await sendOrderStatusNotification(orderCheck[0].email, orderDetails, 'cancelled');

    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling order:', err);
    if (err.code === 'ER_TRUNCATED_WRONG_VALUE' || err.code === 'WARN_DATA_TRUNCATED') {
      return res.status(500).json({ error: 'Database schema error: Status column cannot accept "cancelled". Please contact support.' });
    }
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});
// INVOICE GENERATION ENDPOINT
app.get('/order/:order_id/invoice', verifyToken, async (req, res) => {
  try {
    const orderId = req.params.order_id;
    const userId = req.user.id;

    // Get order details
    const [orderDetails] = await db.query(`
      SELECT o.*, oi.quantity, oi.price, p.product_name
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = ? AND o.user_id = ?
    `, [orderId, userId]);

    if (orderDetails.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderDetails[0];
    const items = orderDetails.map(item => ({
      quantity: item.quantity || 1,
      description: item.product_name,
      "tax-rate": 0,
      price: parseFloat(item.price || item.product_price)
    }));

    const invoiceData = {
  
  image: {
    logo: "data:image/jpeg;base64," + logoBase64,
  },

      "sender": {
        "company": "Nandini Brass & Metal Crafts",
        "address": "Chilkanagar, Near Uppal Cricket Stadium, Uppal shop no:21-113/4",
        "zip": "500039",
        "city": "Hyderabad",
        "State": "Telangana",
        "country": "India"
      },
      "client": {
        "company": order.name,
        "address": order.street,
        "zip": order.zip,
        "city": order.city,
        "country": order.country
      },
      "information": {
        "number": orderId,
        "date": new Date(order.order_date).toLocaleDateString(),
        "due-date": new Date().toLocaleDateString()
      },
      "products": items,
      "bottom-notice": "Thank you for your business!",
      "settings": {
        "currency": "INR"
      }
    };

    const result = await easyinvoice.createInvoice(invoiceData);
    const pdfBuffer = Buffer.from(result.pdf, 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// PHOTOS ENDPOINTS
app.post('/photos', upload.array('photos'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos uploaded' });
    }

    const photoInserts = req.files.map(file => [
      file.filename,
      file.path,
      file.originalname,
      file.size
    ]);

    await db.query(
      `INSERT INTO photos (filename, image_path, original_name, file_size) VALUES ?`,
      [photoInserts]
    );

    res.json({
      message: 'Photos uploaded successfully',
      count: req.files.length
    });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

app.get('/photos', async (_, res) => {
  try {
    const [results] = await db.query(
      `SELECT id, filename, image_path, original_name, file_size, upload_date
       FROM photos
       ORDER BY upload_date DESC`
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

app.delete('/photos/:id', async (req, res) => {
  try {
    const photoId = req.params.id;
    const [photoInfo] = await db.query('SELECT image_path FROM photos WHERE id = ?', [photoId]);

    if (photoInfo.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const [result] = await db.query('DELETE FROM photos WHERE id = ?', [photoId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    try {
      if (fs.existsSync(photoInfo[0].image_path)) {
        fs.unlinkSync(photoInfo[0].image_path);
      }
    } catch (fileErr) {
      console.error('Error deleting physical file:', fileErr);
    }

    res.json({ message: 'Photo deleted successfully' });
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

app.delete('/photos', async (_, res) => {
  try {
    const [photos] = await db.query('SELECT image_path FROM photos');
    await db.query('DELETE FROM photos');

    photos.forEach(photo => {
      try {
        if (fs.existsSync(photo.image_path)) {
          fs.unlinkSync(photo.image_path);
        }
      } catch (fileErr) {
        console.error('Error deleting physical file:', fileErr);
      }
    });

    res.json({ message: 'All photos deleted successfully' });
  } catch (err) {
    console.error('Error deleting all photos:', err);
    res.status(500).json({ error: 'Failed to delete all photos' });
  }
});

app.get('/viewphotos', async (_, res) => {
  try {
    const [results] = await db.query(
      `SELECT id, filename, image_path, original_name, file_size, upload_date
       FROM photos
       ORDER BY upload_date DESC`
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Get variants with images for display
app.get('/products/:productId/variants-with-images', async (req, res) => {
  try {
    const { productId } = req.params;
    const [variants] = await db.query(`
      SELECT 
        pv.*,
        pi.image_path
      FROM product_variants pv
      LEFT JOIN product_img pi ON pv.image_id = pi.id
      WHERE pv.product_id = ? AND pv.is_available = TRUE 
      ORDER BY pv.variant_name
    `, [productId]);

    res.json(variants);
  } catch (err) {
    console.error('Variants with images fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch product variants with images' });
  }
});

// Debug endpoint
app.get('/debug/products', async (_, res) => {
  try {
    const [allProducts] = await db.query('SELECT * FROM products');
    const [preOrderProducts] = await db.query('SELECT * FROM products WHERE is_preorder = TRUE');
    const [variants] = await db.query('SELECT * FROM product_variants');

    res.json({
      allProducts: allProducts,
      preOrderProducts: preOrderProducts,
      variants: variants,
      counts: {
        total: allProducts.length,
        preOrder: preOrderProducts.length,
        variants: variants.length
      }
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: err.message });
  }
});












// ... existing code ...
app.use('/upload', express.static('upload'));



// Add endpoint to serve static files properly
app.use('/upload', express.static(path.join(__dirname, 'upload')));

// Add a debug endpoint to check what images exist
app.get('/debug/images/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const [images] = await db.query(
      'SELECT * FROM product_img WHERE product_id = ?',
      [productId]
    );
    res.json({
      productId,
      images,
      imageCount: images.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ... rest of your existing code ...


// Get single product by its ID (include image if needed)
app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // You may want to join with product_img and categories if needed
    const [results] = await db.query(
      `SELECT p.*, pi.image_path, c.name as category_name
       FROM products p
       LEFT JOIN product_img pi ON p.id = pi.product_id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?
       LIMIT 1`,
      [id]
    );
    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});
app.use('/images', express.static(path.join(__dirname, 'uploads')));














// Multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "upload/"),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, "_")),
});


/* ========== ADMIN ENDPOINTS ========== */

// CREATE product with options and photos - Admin
app.post("/api/admin/preorder-products", upload.array('photos', 8), async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const { name, description, options } = req.body;

    if (!name || !description || !options) {
      return res.status(400).json({ error: "Name, description, and options are required" });
    }

    const [prodResult] = await conn.execute(
      "INSERT INTO preorder_products (name, description) VALUES (?, ?)",
      [name, description]
    );
    const productId = prodResult.insertId;

    const parsedOptions = JSON.parse(options);
    if (!Array.isArray(parsedOptions) || parsedOptions.length === 0) {
      throw new Error("Options must be a non-empty array");
    }

    for (const opt of parsedOptions) {
      if (!opt.material_type || !opt.weight || !opt.quantity || !opt.price) {
        throw new Error("All option fields are required");
      }
      await conn.execute(
        `INSERT INTO preorder_product_options
         (preorder_product_id, material_type, weight, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [productId, opt.material_type, opt.weight, opt.quantity, opt.price]
      );
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await conn.execute(
          `INSERT INTO preorder_product_photos (preorder_product_id, photo_url) VALUES (?, ?)`,
          [productId, `/upload/${file.filename}`]
        );
      }
    } else {
      throw new Error("At least one photo is required");
    }

    await conn.commit();
    console.log(`Product created: ID ${productId}`);
    res.json({ message: "Product created successfully" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error creating product:", err.message, err.stack);
    res.status(500).json({ error: "Failed to add product", details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// READ: Get all products with options and photos
app.get("/api/preorder-products", async (req, res) => {
  try {
    console.log("Fetching products...");
    const [products] = await db.query(`SELECT * FROM preorder_products ORDER BY created_at DESC`);
    console.log("Products fetched:", products);

    const result = await Promise.all(
      products.map(async (product) => {
        const [photos] = await db.query(
          `SELECT photo_url FROM preorder_product_photos WHERE preorder_product_id = ?`,
          [product.id]
        );
        const [options] = await db.query(
          `SELECT * FROM preorder_product_options WHERE preorder_product_id = ?`,
          [product.id]
        );
        return {
          ...product,
          photos: photos.map((p) => p.photo_url),
          options,
        };
      })
    );

    console.log("Processed products:", result);
    res.json(result);
  } catch (err) {
    console.error("Error in /api/preorder-products:", err.message, err.stack);
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
});

// UPDATE: Edit product, replace all options, optionally replace photos
app.put("/api/admin/preorder-products/:id", upload.array('photos', 8), async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const { name, description, options } = req.body;
    const id = req.params.id;

    if (!name || !description || !options) {
      return res.status(400).json({ error: "Name, description, and options are required" });
    }

    const [productCheck] = await conn.query("SELECT id FROM preorder_products WHERE id = ?", [id]);
    if (productCheck.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    await conn.execute(
      "UPDATE preorder_products SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
    );

    // Replace options
    await conn.execute(`DELETE FROM preorder_product_options WHERE preorder_product_id = ?`, [id]);
    const parsedOptions = JSON.parse(options);
    if (!Array.isArray(parsedOptions) || parsedOptions.length === 0) {
      throw new Error("Options must be a non-empty array");
    }

    for (const opt of parsedOptions) {
      if (!opt.material_type || !opt.weight || !opt.quantity || !opt.price) {
        throw new Error("All option fields are required");
      }
      await conn.execute(
        `INSERT INTO preorder_product_options
         (preorder_product_id, material_type, weight, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [id, opt.material_type, opt.weight, opt.quantity, opt.price]
      );
    }

    // Replace photos if provided
    if (req.files.length > 0) {
      await conn.execute(`DELETE FROM preorder_product_photos WHERE preorder_product_id = ?`, [id]);
      for (const file of req.files) {
        await conn.execute(
          `INSERT INTO preorder_product_photos (preorder_product_id, photo_url) VALUES (?, ?)`,
          [id, `/upload/${file.filename}`]
        );
      }
    }

    await conn.commit();
    console.log(`Product updated: ID ${id}`);
    res.json({ message: "Product updated successfully" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Error updating product:", err.message, err.stack);
    res.status(500).json({ error: "Failed to update product", details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE: Remove product (cascades to photos, options, submissions)
app.delete("/api/admin/preorder-products/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`Attempting to delete product with ID: ${productId}`);

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const [result] = await db.execute("DELETE FROM preorder_products WHERE id = ?", [productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.log(`Product ${productId} deleted successfully`);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err.message, err.stack);
    res.status(500).json({ error: "Failed to delete product", details: err.message });
  }
});

/* ========== USER ENDPOINTS ========== */

// Submit a preorder for a specific option
app.post("/api/preorder/submit", async (req, res) => {
  try {
    const { preorder_product_id, option_id, client_name, contact_email, shipping_address } = req.body;

    if (!preorder_product_id || !option_id || !contact_email) {
      return res.status(400).json({ error: "Product ID, option ID, and email are required" });
    }

    // Validate product and option
    const [[product]] = await db.query(`SELECT id, name, description FROM preorder_products WHERE id = ?`, [preorder_product_id]);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const [[option]] = await db.query(
      `SELECT id, material_type, weight, quantity, price FROM preorder_product_options WHERE id = ? AND preorder_product_id = ?`,
      [option_id, preorder_product_id]
    );
    if (!option) {
      return res.status(404).json({ error: "Option not found or does not belong to the specified product" });
    }

    await db.query(
      `INSERT INTO preorder_submissions
       (preorder_product_id, option_id, client_name, contact_email, shipping_address)
       VALUES (?, ?, ?, ?, ?)`,
      [preorder_product_id, option_id, client_name || null, contact_email, shipping_address || null]
    );

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "admin@nandinibrass.com",
      subject: "New Preorder Submitted",
      html: `
        <p>Preorder for product: <b>${product.name}</b></p>
        <ul>
          <li>Description: ${product.description}</li>
          <li>Material: ${option.material_type}, Weight: ${option.weight}kg, Quantity: ${option.quantity}, Price: ₹${option.price}</li>
          <li>Client name: ${client_name || "(not provided)"}</li>
          <li>Email: ${contact_email}</li>
          <li>Shipping: ${shipping_address || "(not provided)"}</li>
        </ul>
      `,
    });

    console.log(`Preorder submitted: Product ID ${preorder_product_id}, Option ID ${option_id}`);
    res.json({ message: "Preorder submitted successfully" });
  } catch (err) {
    console.error("Error submitting preorder:", err.message, err.stack);
    res.status(500).json({ error: "Failed to submit preorder", details: err.message });
  }
});

// List all user preorders for admin with details
app.get("/api/admin/preorder-submissions", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.client_name, s.contact_email, s.shipping_address, s.created_at,
              p.name AS product_name, p.description AS product_desc,
              o.material_type, o.weight, o.quantity, o.price
       FROM preorder_submissions s
       JOIN preorder_products p ON s.preorder_product_id = p.id
       JOIN preorder_product_options o ON s.option_id = o.id
       ORDER BY s.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching submissions:", err.message, err.stack);
    res.status(500).json({ error: "Failed to fetch submissions", details: err.message });
  }
});

// DELETE: Remove a preorder submission
app.delete("/api/admin/preorder-submissions/:id", async (req, res) => {
  try {
    const submissionId = req.params.id;
    console.log(`Attempting to delete submission with ID: ${submissionId}`);

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ error: "Invalid submission ID" });
    }

    const [result] = await db.execute("DELETE FROM preorder_submissions WHERE id = ?", [submissionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }

    console.log(`Submission ${submissionId} deleted successfully`);
    res.json({ message: "Submission deleted successfully" });
  } catch (err) {
    console.error("Error deleting submission:", err.message, err.stack);
    res.status(500).json({ error: "Failed to delete submission", details: err.message });
  }
});