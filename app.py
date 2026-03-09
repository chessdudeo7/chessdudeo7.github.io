import sqlite3
import os
from flask import Flask, request, jsonify, redirect, send_from_directory
import pandas as pd

app = Flask(__name__, static_url_path='', static_folder='static')
DB_FILE = "tutoring.db"
CSV_FILE = "schedule.csv"

# 1. Initialize the SQL Database
def init_db():
    conn = sqlite3.connect(DB_FILE)
    # This table stores the actual confirmed bookings
    conn.execute('''CREATE TABLE IF NOT EXISTS bookings
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  slot_id TEXT UNIQUE,
                  student_name TEXT,
                  student_email TEXT,
                  subject TEXT)''')
    conn.close()

init_db()

# 2. Serve the home page
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# 3. API: Get Available Slots (SQL + Pandas)
@app.route('/api/slots', methods=['GET'])
def get_available_slots():
    conn = sqlite3.connect(DB_FILE)
    booked_df = pd.read_sql_query("SELECT slot_id FROM bookings", conn)
    conn.close()
    
    master_df = pd.read_csv(CSV_FILE)
    booked_ids = booked_df['slot_id'].astype(str).tolist()
    
    events = []
    for _, row in master_df.iterrows():
        is_booked = str(row['slot_id']) in booked_ids
        
        if is_booked:
            # booked style
            events.append({
                "id": str(row['slot_id']),
                "title": "Session Booked",
                "start": str(row['start_time']),
                "end": str(row['end_time']),
                "backgroundColor": "#991b1b", # red
                "borderColor": "#7f1d1d",
                "editable": False,
                "display": 'block'
            })
        else:
            # available style
            events.append({
                "id": str(row['slot_id']),
                "title": "Available Session",
                "start": str(row['start_time']),
                "end": str(row['end_time']),
                "backgroundColor": "#4338ca", 
                "borderColor": "#3730a3"
            })
    return jsonify(events)

# 4. API: Book a Slot (Saves to SQL)
@app.route('/api/book', methods=['POST'])
def book_slot():
    slot_id = request.form.get('slot_id')
    name = request.form.get('student_name')
    email = request.form.get('student_email')
    subject = request.form.get('subject')

    try:
        conn = sqlite3.connect(DB_FILE)
        # SQL handles the "Security" - UNIQUE constraint prevents double-booking
        conn.execute("INSERT INTO bookings (slot_id, student_name, student_email, subject) VALUES (?, ?, ?, ?)",
                     (slot_id, name, email, subject))
        conn.commit()
        conn.close()
        return redirect('/booking.html?success=true')
    except sqlite3.IntegrityError:
        return "Error: This slot was just taken by someone else!", 400
    except Exception as e:
        return f"System Error: {str(e)}", 500

if __name__ == '__main__':
    print("🚀 Server starting at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)