import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search, User, Calendar, TrendingUp, AlertTriangle, CheckCircle, BookOpen, Clock } from 'lucide-react';

const SHEET_API_KEY = "AIzaSyBHZVQ3eDh4zDHYTgCmDhWdA21rfGlfNOA"; // 🔑 Replace with your API key
const ATTENDANCE_SHEET_ID = "1ImbQ-Aem9jQOzuWDA8xVCB456NH4AVpcGHrQV1QX6No";
const MASTER_SHEET_ID = "11nhx2rgEJootVP3L64yCaVUbevYbFRwKkmUbkuYHhC0";

const StudentAttendanceDashboard = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [masterStudentData, setMasterStudentData] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1️⃣ Fetch Attendance Sheet
  useEffect(() => {
    const fetchSheetsData = async () => {
      try {
        // Attendance Sheet
        const attendanceRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${ATTENDANCE_SHEET_ID}/values/Attendance!A1:ZZ1000?key=${SHEET_API_KEY}`
        );

        const attendanceJson = await attendanceRes.json();
        const rows = attendanceJson.values;

        if (!rows) return;

        const headers = rows[0];
        const data = rows.slice(1).map((row, i) => {
          const entry = {};
          headers.forEach((h, idx) => {
            entry[h] = row[idx] || '';
          });
          return entry;
        });
        //console.log("Fetched attendance data:", data);
        setAttendanceData(data);

        // Master Sheet
        const masterRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SHEET_ID}/values/All_Students_with_IDs!A1:Z1000?key=${SHEET_API_KEY}`
        );
        const masterJson = await masterRes.json();
        const masterRows = masterJson.values;
        if (!masterRows) return;

        const masterHeaders = masterRows[0];
        const masterData = masterRows.slice(1).map((row) => {
          const entry = {};
          masterHeaders.forEach((h, idx) => {
            entry[h] = row[idx] || '';
          });
          return entry;
        });
        setMasterStudentData(masterData);
      } catch (err) {
        console.error("Error fetching Google Sheets data", err);
        setError("Failed to load data from Google Sheets.");
      }
    };

    fetchSheetsData();
  }, []);
  const calculateAttendancePercentage = (attended, total) => {
    if (total === 0) return 0;
    return ((attended / total) * 100).toFixed(2); // ✅ returns string with 2 decimals
  };


  const getAttendanceStatus = (percentage) => {
    if (percentage >= 80) return { status: 'Excellent', color: 'text-green-600', icon: CheckCircle };
    if (percentage >= 60) return { status: 'Good', color: 'text-yellow-600', icon: TrendingUp };
    return { status: 'Needs Improvement', color: 'text-red-600', icon: AlertTriangle };
  };


  const generateAttendanceTrend = (dailyAttendance) => {
    const sortedEntries = Object.entries(dailyAttendance)
      .sort(([a], [b]) => new Date(a) - new Date(b));

    let cumulativeAttended = 0;
    let cumulativeMissed = 0;

    return sortedEntries.map(([date, status], idx) => {
      const attended = status === 1 ? 1 : 0;
      const missed = status === "X" ? 1 : 0;

      cumulativeAttended += attended;
      cumulativeMissed += missed;

      return {
        date,
        attended,
        missed,
        cumulative: cumulativeAttended,
        cumulativeMissed
      };
    });
  };



  const getLastAttendedDate = (dailyAttendance) => {
    const dates = Object.keys(dailyAttendance).filter(date => dailyAttendance[date] > 0);

    return dates.length > 0 ? dates[dates.length - 1] : 'No attendance recorded';
  };

  const extractTotalClassesFromPackage = (packageName) => {
    if (!packageName) return 0;

    // If the string contains "classes"
    if (packageName.toLowerCase().includes("classes")) {
      const numbers = packageName.match(/\d+/g); // get all numbers in the string
      return numbers && numbers.length > 0 ? parseInt(numbers[numbers.length - 1]) : 0; // take the last number
    }

    // If the string contains "sessions"
    if (packageName.toLowerCase().includes("sessions")) {
      const match = packageName.match(/(\d+)\s*sessions/i); // get number before "sessions"
      return match ? parseInt(match[1]) : 0;
    }

    return 0; // default if no match found
  };

  // ✅ Marks absences (X) for missed Sat/Sun after last attended date till 10-Jul
  // Helper to convert "10-Jul" → Date(2025-07-10)
  const parseDate = (dateStr) => {
    // dateStr is like "10-Jul"
    const [day, monthStr] = dateStr.split("-");
    const monthMap = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    return new Date(2025, monthMap[monthStr], parseInt(day, 10));
  };

  const markAbsences = (dailyAttendance) => {
    const cutoffDate = new Date(2025, 6, 10); // 10-Jul-2025
    const dates = Object.keys(dailyAttendance).sort(
      (a, b) => parseDate(a) - parseDate(b)
    );

    if (dates.length === 0) return dailyAttendance;

    // Find last attended date
    const lastAttendedDate = dates.reduce((latest, d) => {
      if (dailyAttendance[d] === 1 && parseDate(d) > parseDate(latest)) return d;
      return latest;
    }, dates[0]);

    console.log("🔎 Dates sorted:", dates);
    console.log("🔎 Last Attended Date:", lastAttendedDate);

    const updated = { ...dailyAttendance };

    dates.forEach(date => {
      const current = parseDate(date);
      const day = current.getDay(); // 0=Sunday, 6=Saturday

      console.log(`Checking ${date} (${current.toDateString()}) → day=${day}, value=${updated[date]}`);

      if (current < parseDate(lastAttendedDate) && current >= cutoffDate) {
        if ((day === 0 || day === 6) && updated[date] === "") {
          console.log(`✅ Marking ${date} as absent (X)`);
          updated[date] = "X";
        }
      }
    });

    console.log("✅ Final Daily Attendance:", updated);
    return updated;
  };


  const handleSearch = () => {
    if (!studentId.trim()) {
      setError('Please enter a Student ID or Name');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      // Find student from Attendance sheet
      const student = attendanceData.find(s =>
        s['Sr No.'] === studentId ||
        s['Student Name'].toLowerCase().includes(studentId.toLowerCase())
      );

      if (student) {
        // Inside handleSearch(), after finding `student`
        let dailyAttendance = Object.keys(student)
          .filter(k => /\d{2}-[A-Za-z]{3}/.test(k))
          .reduce((obj, key) => {
            if (student[key] === "1") {
              obj[key] = 1;
            } else if (student[key] === "") {
              obj[key] = "";  // preserve empty value
            } else {
              obj[key] = 0; // for any explicit 0s if they exist
            }
            return obj;
          }, {});

        // ✅ Determine cutoff date: End Date (if provided) OR last attended date
        const cutoffDate = student["End Date"] &&
          student["End Date"].toLowerCase() !== "end date not applicable"
          ? parseDateFlexible(student["End Date"])
          : parseDate(getLastAttendedDate(dailyAttendance)); // fallback

        // ✅ Filter dailyAttendance up to cutoff date
        dailyAttendance = Object.keys(dailyAttendance)
          .filter(d => parseDate(d) <= cutoffDate)
          .reduce((obj, d) => {
            obj[d] = dailyAttendance[d];
            return obj;
          }, {});

        // ✅ Automatically fill absences up to 10-Jul
        dailyAttendance = markAbsences(dailyAttendance, "10-Jul");





        const totalClasses = extractTotalClassesFromPackage(student['Package Name']) ||
          (parseInt(student['Historical Class Count'] || 0) + parseInt(student['Classes Attended to-date'] || 0));

        const attendancePercentage = calculateAttendancePercentage(
          parseInt(student['Classes Attended to-date'] || 0),
          totalClasses
        );

        // Find studentId and date of joining from master sheet
        const compositeKey = (student['Student Name'] + student['Course Category']).replace(/\s+/g, '').toLowerCase();
        const masterMatch = masterStudentData.find(m => m['CompositeKey']?.toLowerCase() === compositeKey);

        setStudentData({
          ...student,
          dateOfJoining: masterMatch ? masterMatch['Date of Joining'] : 'Not Found',
          totalClasses,
          attendancePercentage,
          classesAttendedToDate: parseInt(student['Classes Attended to-date'] || 0),
          dailyAttendance, // ✅ store daily attendance
          attendanceTrend: generateAttendanceTrend(dailyAttendance), // ✅ safe fallback
          lastAttendedDate: getLastAttendedDate(dailyAttendance) // ✅ get last attended date
        });


      } else {
        setError('Student not found.');
      }
      setLoading(false);
    }, 500);

  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  // ✅ Safe Flexible Date Parser (won't break if date is missing or invalid)
  const parseDateFlexible = (dateStr) => {
    try {
      if (!dateStr || dateStr.toLowerCase() === "end date not applicable") {
        return null;
      }

      // Accepts "10-Jul-2025" or even "10-Jul"
      const parts = dateStr.split("-");
      if (parts.length < 2) return null;

      const [dayStr, monthStr, yearStr] = parts;
      const day = parseInt(dayStr, 10);
      const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear(); // default to current year

      const monthMap = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
      };

      const month = monthMap[monthStr];
      if (month === undefined || isNaN(day)) return null;

      return new Date(year, month, day);
    } catch (e) {
      console.error("❌ Failed to parse date:", dateStr, e);
      return null;
    }
  };

  // ✅ Compute pie chart attendance stats specifically for 10-Jul → EndDate/LastAttendedDate
  const pieData = React.useMemo(() => {
    if (!studentData) return [];

    // start of window (fixed)
    const cutoffStart = parseDateFlexible("10-Jul-2025");

    // determine cutoff end: End Date if present, otherwise lastAttendedDate
    const endDateStr =
      studentData["End Date"] &&
        studentData["End Date"].toLowerCase() !== "end date not applicable"
        ? studentData["End Date"]
        : studentData.lastAttendedDate;

    // try flexible parsing, fall back to parseDate or normalized string
    const tryParse = (s) => {
      if (!s) return null;
      let d = parseDateFlexible(s);
      if (d) return d;
      // try converting spaces to hyphens (e.g. "10 Jul 2025" -> "10-Jul-2025")
      const alt = s.replace(/\s+/g, "-");
      d = parseDateFlexible(alt);
      if (d) return d;
      try {
        // last resort: parse using simpler parseDate (assumes DD-MMM or DD-MMM-YYYY)
        return parseDate(alt);
      } catch (e) {
        return null;
      }
    };

    const cutoffEnd = tryParse(endDateStr) || cutoffStart; // fallback to cutoffStart if end missing

    // if we somehow failed to parse start/end, return zeros
    if (!cutoffStart || !cutoffEnd || cutoffEnd < cutoffStart) {
      return [
        { name: "Attended", value: 0, color: "#10B981" },
        { name: "Absent", value: 0, color: "#EF4444" },
        { name: "Remaining", value: 0, color: "#E5E7EB" }
      ];
    }

    // Count attended and absent inside the window
    let attendedCount = 0;
    let absentCount = 0;

    Object.entries(studentData.dailyAttendance || {}).forEach(([dateKey, status]) => {
      const currentDate = tryParse(dateKey);
      if (!currentDate) return;
      if (currentDate >= cutoffStart && currentDate <= cutoffEnd) {
        if (status === 1 || status === "1") attendedCount++;
        else if (status === "X") absentCount++;
      }
    });

    // Compute number of scheduled weekend sessions between start and end (inclusive)
    let totalScheduled = 0;
    for (let d = new Date(cutoffStart); d <= cutoffEnd; d.setDate(d.getDate() + 1)) {
      const day = d.getDay(); // 0 = Sunday, 6 = Saturday
      if (day === 0 || day === 6) totalScheduled++;
    }

    const remainingCount = Math.max(totalScheduled - attendedCount - absentCount, 0);

    return [
      { name: "Attended", value: attendedCount, color: "#10B981" },
      { name: "Absent", value: absentCount, color: "#EF4444" },
      { name: "Remaining", value: remainingCount, color: "#E5E7EB" }
    ];
  }, [studentData]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎵 Student Attendance Dashboard
          </h1>
          <p className="text-gray-600">Track your learning journey and attendance insights</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Student ID or Name
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., 1 or Adwita baheti"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-red-600 text-sm">{error}</p>
            )}
          </div>
        </div>

        {/* Student Dashboard */}
        {studentData && (
          <div className="space-y-8">
            {/* Student Profile */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <User className="h-8 w-8 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-800">Student Profile</h2>
              </div>

              {/* Added Date of Joining as 5th grid item */}
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Student Name */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-600 mb-1">Student Name</h3>
                  <p className="text-lg font-bold text-gray-900">{studentData['Student Name']}</p>
                </div>

                {/* Course Category */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-600 mb-1">Course Category</h3>
                  <p className="text-lg font-bold text-indigo-600">{studentData['Course Category']}</p>
                </div>

                {/* Activity */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-600 mb-1">Activity</h3>
                  <p className="text-lg font-bold text-gray-900">{studentData['Activity']}</p>
                </div>

                {/* Package */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-600 mb-1">Package</h3>
                  <p className="text-sm text-gray-900">{studentData['Package Name']}</p>
                </div>

                {/* ✅ Date of Joining */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-600 mb-1">Date of Joining</h3>
                  <p className="text-lg font-bold text-gray-900">
                    {(() => {
                      if (!studentData.dateOfJoining || studentData.dateOfJoining === "Not Found") {
                        return "Not Found";
                      }
                      const [month, day, year] = studentData.dateOfJoining.split("/");
                      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
                    })()}
                  </p>
                </div>

              </div>
            </div>


            {/* Attendance Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Classes Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">{studentData.totalClasses}</span>
                </div>
                <h3 className="font-semibold text-gray-800">Total Classes Allotted</h3>
                <p className="text-gray-600 text-sm">From your package</p>
              </div>

              {/* Classes Attended Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">{studentData.classesAttendedToDate}</span>
                </div>
                <h3 className="font-semibold text-gray-800">Classes Attended</h3>
                <p className="text-gray-600 text-sm">To date</p>
              </div>

              {/* Attendance Rate Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-600">{studentData.attendancePercentage}%</span>
                </div>
                <h3 className="font-semibold text-gray-800">Attendance Rate</h3>
                <p className="text-gray-600 text-sm">Overall performance</p>
              </div>

              {/* ✅ Start Date + Last Attended in the same row */}
              <div className="flex flex-col gap-4">
                {/* Start Date Card */}
                <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">Start Date</h3>
                    <p className="text-gray-600 text-sm">{studentData['Start Date']}</p>
                  </div>
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>

                {/* Last Attended Card */}
                <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">Last Attended</h3>
                    <p className="text-gray-600 text-sm">{studentData.lastAttendedDate}</p>
                  </div>
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>


            {/* Attendance Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center">
                {(() => {
                  const statusInfo = getAttendanceStatus(studentData.attendancePercentage);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div>
                      <StatusIcon className={`h-16 w-16 mx-auto mb-4 ${statusInfo.color.replace('text-', 'text-')}`} />
                      <h3 className={`text-2xl font-bold mb-2 ${statusInfo.color}`}>
                        {statusInfo.status}
                      </h3>
                      <p className="text-gray-600">
                        Your attendance is at {studentData.attendancePercentage}%
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className='text-center'>Note: All the below Attendance metrics are calculated from 10th july 2025 to package End Date</div>
            {/* Visual Analytics */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Attendance Trend Chart */}
              {studentData?.attendanceTrend && studentData.attendanceTrend.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Attendance Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={studentData.attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#4F46E5"
                        strokeWidth={3}
                        dot={{ fill: '#4F46E5', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Attendance Breakdown Pie Chart */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Class Progress</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-6 mt-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Attended ({pieData[0]?.value || 0})
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Absent ({pieData[1]?.value || 0})
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Remaining ({pieData[2]?.value || 0})
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Daily Attendance Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Attendance Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {Object.entries(studentData.dailyAttendance || {}).map(([date, attended]) => (
                  <div
                    key={date}
                    className={`p-3 rounded-lg text-center border 
                      ${attended === 1
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : attended === 'X'
                          ? 'bg-red-50 border-red-200 text-red-600'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                  >
                    <div className="text-xs font-medium">{date}</div>
                    <div className="text-lg font-bold mt-1">
                      {attended === 1 ? '✓' : attended === 'X' ? '✗' : '—'}
                    </div>
                  </div>

                ))}

              </div>
              {Object.keys(studentData.dailyAttendance).length === 0 && (
                <p className="text-gray-500 text-center py-8">No recent attendance data available</p>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!studentData && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Use</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex flex-col items-center">
                <Search className="h-12 w-12 text-indigo-600 mb-3" />
                <h4 className="font-semibold mb-2">1. Enter Student ID</h4>
                <p className="text-gray-600 text-sm text-center">Enter your student number (1-10) or name in the search box</p>
              </div>
              <div className="flex flex-col items-center">
                <TrendingUp className="h-12 w-12 text-green-600 mb-3" />
                <h4 className="font-semibold mb-2">2. View Analytics</h4>
                <p className="text-gray-600 text-sm text-center">See your attendance trends, progress, and detailed insights</p>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle className="h-12 w-12 text-blue-600 mb-3" />
                <h4 className="font-semibent mb-2">3. Track Progress</h4>
                <p className="text-gray-600 text-sm text-center">Monitor your learning journey and stay on track</p>
              </div>
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">💡 Try searching with: 1, 2, 3, 4, 5, 6, or 10</p>
              <p className="text-blue-600 text-sm mt-1">Or use student names like "Adwita", "Gopal", or "Soham"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendanceDashboard;