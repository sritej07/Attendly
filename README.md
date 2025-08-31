
# 🎵 Student Attendance Dashboard

A beautiful, interactive **React-based dashboard** to track student attendance, visualize trends, and get insights into class participation.  
This project fetches data from **Google Sheets API** and displays key metrics like **total classes, attendance percentage, last attended date, absences, and remaining classes** with engaging visuals.

---

## 🚀 Features

✅ **Google Sheets Integration** – Fetches attendance & student data dynamically.  
✅ **Search by ID or Name** – Quickly find any student’s profile.  
✅ **Attendance Insights** – Shows attended, absent, and remaining classes.  
✅ **Visual Charts** – Includes Pie chart & Trend line chart for easy analysis.  
✅ **Daily Attendance View** – Displays presence/absence for each class date.  
✅ **Responsive Design** – Works on desktop, tablet, and mobile devices.  

---

## 🛠️ Tech Stack

- **Frontend:** React + TailwindCSS  
- **Charts:** Recharts (Line & Pie Charts)  
- **Icons:** Lucide React  
- **Data Source:** Google Sheets API v4  

---

## 📦 Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/sritej07/Attendly.git
   cd Attendly
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Your Google Sheets API Key**
   - Open `StudentAttendanceDashboard.jsx`
   - Replace the `SHEET_API_KEY`, `ATTENDANCE_SHEET_ID`, and `MASTER_SHEET_ID` with your own.

4. **Run the Development Server**
   ```bash
   npm start
   ```
   Your app will be available at **http://localhost:3000**

---

## 🧠 How It Works

1. Fetches **Attendance Sheet** and **Master Student Sheet** data from Google Sheets API.
2. Filters attendance from **10-Jul-2025** to **End Date** (or **last attended date** if end date is missing).
3. Calculates:
   - **Classes Attended**
   - **Absences** (Marked as `X`)
   - **Remaining Classes**
   - **Attendance Percentage (Rounded to 2 Decimals)**
4. Displays insights:
   - Student profile details
   - Total classes, attendance %, last attended date
   - Pie chart with Attended, Absent, Remaining
   - Trend chart with cumulative attendance

---


## 🧩 Future Improvements

- ✅ Authentication (Student login to view only their data)
- ✅ Export attendance reports as PDF/Excel
- ✅ Admin panel for updating Google Sheet data from UI
- ✅ Dark mode support

---

## 📜 License

This project is licensed under the **MIT License** – free to use and modify.

---

## 🙌 Contributing

Pull requests are welcome!  
For major changes, please open an issue first to discuss what you would like to change.

---

## 💡 Author

Built with ❤️ by Sritej Vipparla 
If you like this project, ⭐ it on GitHub and share it with your friends!
