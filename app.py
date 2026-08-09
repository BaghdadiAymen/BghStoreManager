import sqlite3
import os
import textwrap
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session, redirect, url_for

app = Flask(__name__)
app.secret_key = 'super_secret_store_key_change_me'  # Needed for user sessions
DB_NAME = 'store.db'
STORE_NAME = "BOUKHARI ZONE"

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        # Update products schema
        conn.execute('''
            CREATE TABLE IF NOT EXISTS products (
                qr_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT,
                buy_price REAL DEFAULT 0,
                price REAL NOT NULL,
                stock INTEGER NOT NULL,
                supplier TEXT DEFAULT ''
            )
        ''')
        
        # Check and add columns if upgrading existing db
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(products)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'buy_price' not in columns:
            conn.execute('ALTER TABLE products ADD COLUMN buy_price REAL DEFAULT 0')
        if 'supplier' not in columns:
            conn.execute("ALTER TABLE products ADD COLUMN supplier TEXT DEFAULT ''")

        conn.execute('''
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                qr_id TEXT,
                product_name TEXT,
                price REAL,
                buy_price REAL DEFAULT 0,
                qty INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Users Table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            )
        ''')

        # Insert Default Users
        cursor.execute('SELECT COUNT(*) FROM users')
        if cursor.fetchone()[0] == 0:
            conn.executemany('INSERT INTO users VALUES (?,?,?)', [
                ('admin', 'admin123', 'admin'),
                ('seller', 'seller123', 'seller')
            ])

        # Insert sample data on first run
        cursor.execute('SELECT COUNT(*) FROM products')
        if cursor.fetchone()[0] == 0:
            sample_products = [
                ('1001', 'iPhone 15 Pro Case Clear', 'Cases', 10.00, 15.00, 20, 'Apple Supplier'),
                ('1002', 'USB-C Fast Charger 20W', 'Chargers', 15.00, 25.00, 15, 'Anker Supplier'),
                ('1003', 'Samsung S24 Glass Protector', 'Protectors', 5.00, 10.00, 30, 'ScreenTech'),
                ('1004', 'AirPods Pro Case Silicone', 'Accessories', 4.00, 8.50, 12, 'Accs Co')
            ]
            conn.executemany('INSERT INTO products VALUES (?,?,?,?,?,?,?)', sample_products)

init_db()

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def format_price(price):
    price = float(price or 0)
    if price == int(price):
        return f"{int(price)} DA"
    return f"{price:.2f}".rstrip("0").rstrip(".") + " DA"

# --- AUTH ROUTES ---

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json or {}
        username = data.get('username')
        password = data.get('password')

        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password)).fetchone()
        conn.close()

        if user:
            session['user'] = user['username']
            session['role'] = user['role']
            return jsonify({"status": "success", "role": user['role']})
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401

    return render_template('login.html', store_name=STORE_NAME)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/')
def index():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('index.html', store_name=STORE_NAME, role=session.get('role'), username=session.get('user'))

# --- PRODUCT APIs ---

@app.route('/api/product/<qr_id>')
def get_product(qr_id):
    conn = get_db_connection()
    product = conn.execute('SELECT * FROM products WHERE qr_id = ?', (qr_id,)).fetchone()
    conn.close()
    if product:
        p_dict = dict(product)
        if session.get('role') != 'admin':
            p_dict.pop('buy_price', None)
            p_dict.pop('supplier', None)
        return jsonify(p_dict)
    return jsonify({"error": "Product not found"}), 404

@app.route('/api/products')
def get_products():
    search = request.args.get('search', '')
    conn = get_db_connection()
    if search:
        query = 'SELECT * FROM products WHERE qr_id LIKE ? OR name LIKE ? OR category LIKE ? ORDER BY name'
        like = f'%{search}%'
        products = conn.execute(query, (like, like, like)).fetchall()
    else:
        products = conn.execute('SELECT * FROM products ORDER BY name').fetchall()
    conn.close()

    result = []
    for p in products:
        d = dict(p)
        if session.get('role') != 'admin':
            d.pop('buy_price', None)
            d.pop('supplier', None)
        result.append(d)

    return jsonify(result)

@app.route('/api/product/save', methods=['POST'])
def save_product():
    if session.get('role') != 'admin':
        return jsonify({"status": "error", "message": "Admin privileges required"}), 403

    data = request.json or {}
    qr_id = str(data.get('qr_id', '')).strip()
    name = str(data.get('name', '')).strip()
    category = str(data.get('category', 'General')).strip()
    supplier = str(data.get('supplier', '')).strip()

    if not qr_id or not name:
        return jsonify({"status": "error", "message": "ID and Name are required"}), 400

    try:
        buy_price = float(data.get('buy_price', 0))
        price = float(data.get('price', 0))
        stock = int(data.get('stock', 0))
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "Prices and stock must be numbers"}), 400

    conn = get_db_connection()
    conn.execute('''
        INSERT INTO products (qr_id, name, category, buy_price, price, stock, supplier)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(qr_id) DO UPDATE SET
            name=excluded.name,
            category=excluded.category,
            buy_price=excluded.buy_price,
            price=excluded.price,
            stock=excluded.stock,
            supplier=excluded.supplier
    ''', (qr_id, name, category, buy_price, price, stock, supplier))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Product saved successfully!"})

@app.route('/api/product/delete/<qr_id>', methods=['DELETE'])
def delete_product(qr_id):
    if session.get('role') != 'admin':
        return jsonify({"status": "error", "message": "Admin privileges required"}), 403

    conn = get_db_connection()
    conn.execute('DELETE FROM products WHERE qr_id = ?', (qr_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Product deleted!"})

# --- CHECKOUT & SALES APIs ---

@app.route('/api/checkout', methods=['POST'])
def checkout():
    cart = (request.json or {}).get('cart', [])
    if not cart:
        return jsonify({"status": "error", "message": "Cart is empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        sale_records = []
        for item in cart:
            qr_id = item['qr_id']
            qty = int(item['qty'])
            custom_price = float(item['price'])
            
            row = cursor.execute('SELECT name, stock, buy_price FROM products WHERE qr_id = ?', (qr_id,)).fetchone()
            if row is None:
                raise ValueError(f"Product {qr_id} no longer exists")
            if row['stock'] < qty:
                raise ValueError(f"Not enough stock for '{row['name']}' (have {row['stock']}, need {qty})")

            sale_records.append({
                "qr_id": qr_id,
                "name": row['name'],
                "price": custom_price,
                "buy_price": row['buy_price'],
                "qty": qty
            })

        sale_ids = []
        for s in sale_records:
            cursor.execute('UPDATE products SET stock = stock - ? WHERE qr_id = ?', (s['qty'], s['qr_id']))
            cursor.execute('''
                INSERT INTO sales (qr_id, product_name, price, buy_price, qty)
                VALUES (?, ?, ?, ?, ?)
            ''', (s['qr_id'], s['name'], s['price'], s['buy_price'], s['qty']))
            sale_ids.append(cursor.lastrowid)

        conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": "Sale completed!", "sale_ids": sale_ids})
    except ValueError as e:
        conn.rollback()
        conn.close()
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/sales')
def get_sales():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    conn = get_db_connection()
    
    query = '''
        SELECT id, qr_id, product_name, price, buy_price, qty, (price * qty) as total, created_at
        FROM sales
    '''
    params = []

    if start_date and end_date:
        query += ' WHERE DATE(created_at) BETWEEN DATE(?) AND DATE(?)'
        params.extend([start_date, end_date])
    elif start_date:
        query += ' WHERE DATE(created_at) = DATE(?)'
        params.append(start_date)
    else:
        query += " WHERE DATE(created_at) = DATE('now')"

    query += ' ORDER BY created_at DESC'

    sales = conn.execute(query, params).fetchall()

    total_revenue = sum(s['total'] for s in sales)
    total_items = sum(s['qty'] for s in sales)

    conn.close()

    sales_list = []
    for s in sales:
        d = dict(s)
        if session.get('role') != 'admin':
            d.pop('buy_price', None)
        sales_list.append(d)

    return jsonify({
        "sales": sales_list,
        "total_revenue": total_revenue,
        "total_items": total_items
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)