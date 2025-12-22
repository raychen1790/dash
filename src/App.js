import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SpaceMissionsDashboard = () => {
  const [csvData, setCsvData] = useState(null);
  const [filters, setFilters] = useState({
    company: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headerLine = lines[0];
    const headers = [];
    let curr = '';
    let inQuotes = false;
    
    for (let char of headerLine) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        headers.push(curr.trim().replace(/^"|"$/g, ''));
        curr = '';
      } else {
        curr += char;
      }
    }
    headers.push(curr.trim().replace(/^"|"$/g, ''));
    
    const data = lines.slice(1).map(line => {
      if (!line.trim()) return null; 
      const vals = [];
      curr = '';
      inQuotes = false;
      for (let char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          vals.push(curr.trim().replace(/^"|"$/g, ''));
          curr = '';
        } else {
          curr += char;
        }
      }
      vals.push(curr.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = vals[idx] || '';
      });
      return obj;
    }).filter(row => row !== null);
    return data;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.numbers')) {
        alert('Please upload a .csv file. If you have a .numbers file, export it as CSV first.');
        return;
      }
      try {
        const text = await file.text();
        const data = parseCSV(text);
        if (data.length === 0) {
          alert('No data found in file. Please check the file format.');
          return;
        }
        console.log(`Loaded ${data.length} missions`);
        console.log('Sample data:', data[0]);
        console.log('Column names:', Object.keys(data[0]));
        console.log('First mission status value:', data[0].MissionStatus);
        setCsvData(data);
      } catch (err) {
        console.error('Error loading file:', err);
        alert('Error loading file. Please ensure it is a valid CSV file.');
      }
    }
  };

  const getMissionCountByCompany = (companyName) => {
    try {
      if (!csvData || csvData.length === 0) return 0;
      if (typeof companyName !== 'string') return 0;
      if (!companyName.trim()) return 0;
      return csvData.filter(m => m.Company === companyName).length;
    } catch (err) {
      console.error('Error in getMissionCountByCompany:', err);
      return 0;
    }
  };

  const getSuccessRate = (companyName) => {
    try {
      if (!csvData || csvData.length === 0) return 0.0;
      if (typeof companyName !== 'string') return 0.0;
      if (!companyName.trim()) return 0.0;
      
      const missions = csvData.filter(m => m.Company === companyName);
      if (missions.length === 0) return 0.0;
      
      const successes = missions.filter(m => m.MissionStatus === 'Success').length;
      const rate = (successes / missions.length * 100);
      return parseFloat(rate.toFixed(2));
    } catch (err) {
      console.error('Error in getSuccessRate:', err);
      return 0.0;
    }
  };

  const getMissionsByDateRange = (startDate, endDate) => {
    try {
      if (!csvData || csvData.length === 0) return [];
      if (typeof startDate !== 'string' || typeof endDate !== 'string') return [];
      if (!startDate.trim() || !endDate.trim()) return [];
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) return [];
      if (startDate > endDate) return [];
      
      const filtered = csvData.filter(m => {
        const mDate = m.Date;
        return mDate >= startDate && mDate <= endDate;
      });
      return filtered.sort((a, b) => a.Date.localeCompare(b.Date)).map(m => m.Mission);
    } catch (err) {
      console.error('Error in getMissionsByDateRange:', err);
      return [];
    }
  };

  const getTopCompaniesByMissionCount = (n) => {
    try {
      if (!csvData || csvData.length === 0) return [];
      if (typeof n !== 'number' || n < 0 || !Number.isInteger(n)) return [];
      
      const counts = {};
      csvData.forEach(m => {
        counts[m.Company] = (counts[m.Company] || 0) + 1;
      });
      
      const sorted = Object.entries(counts).sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      });
      
      return sorted.slice(0, n);
    } catch (err) {
      console.error('Error in getTopCompaniesByMissionCount:', err);
      return [];
    }
  };

  const getMissionStatusCount = () => {
    try {
      if (!csvData || csvData.length === 0) {
        return {
          'Success': 0,
          'Failure': 0,
          'Partial Failure': 0,
          'Prelaunch Failure': 0
        };
      }
      
      const counts = {
        'Success': 0,
        'Failure': 0,
        'Partial Failure': 0,
        'Prelaunch Failure': 0
      };
      
      csvData.forEach(m => {
        if (counts.hasOwnProperty(m.MissionStatus)) {
          counts[m.MissionStatus]++;
        }
      });
      
      return counts;
    } catch (err) {
      console.error('Error in getMissionStatusCount:', err);
      return {
        'Success': 0,
        'Failure': 0,
        'Partial Failure': 0,
        'Prelaunch Failure': 0
      };
    }
  };

  const getMissionsByYear = (year) => {
    try {
      if (!csvData || csvData.length === 0) return 0;
      if (typeof year !== 'number' || !Number.isInteger(year)) return 0;
      if (year < 1900 || year > 2100) return 0;
      
      return csvData.filter(m => m.Date.startsWith(String(year))).length;
    } catch (err) {
      console.error('Error in getMissionsByYear:', err);
      return 0;
    }
  };

  const getMostUsedRocket = () => {
    try {
      if (!csvData || csvData.length === 0) return '';
      
      const counts = {};
      csvData.forEach(m => {
        if (m.Rocket) {
          counts[m.Rocket] = (counts[m.Rocket] || 0) + 1;
        }
      });
      
      if (Object.keys(counts).length === 0) return '';
      
      const sorted = Object.entries(counts).sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      });
      
      return sorted[0]?.[0] || '';
    } catch (err) {
      console.error('Error in getMostUsedRocket:', err);
      return '';
    }
  };

  const getAverageMissionsPerYear = (startYear, endYear) => {
    try {
      if (!csvData || csvData.length === 0) return 0.0;
      if (typeof startYear !== 'number' || typeof endYear !== 'number') return 0.0;
      if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) return 0.0;
      if (startYear > endYear) return 0.0;
      if (startYear < 1900 || endYear > 2100) return 0.0;
      
      const yearCounts = {};
      for (let yr = startYear; yr <= endYear; yr++) {
        yearCounts[yr] = 0;
      }
      
      csvData.forEach(m => {
        const yr = parseInt(m.Date.substring(0, 4));
        if (yr >= startYear && yr <= endYear) {
          yearCounts[yr]++;
        }
      });
      
      const totalYears = endYear - startYear + 1;
      const totalMissions = Object.values(yearCounts).reduce((s, v) => s + v, 0);
      const avg = totalMissions / totalYears;
      
      return parseFloat(avg.toFixed(2));
    } catch (err) {
      console.error('Error in getAverageMissionsPerYear:', err);
      return 0.0;
    }
  };

  React.useEffect(() => {
    if (csvData) {
      window.getMissionCountByCompany = getMissionCountByCompany;
      window.getSuccessRate = getSuccessRate;
      window.getMissionsByDateRange = getMissionsByDateRange;
      window.getTopCompaniesByMissionCount = getTopCompaniesByMissionCount;
      window.getMissionStatusCount = getMissionStatusCount;
      window.getMissionsByYear = getMissionsByYear;
      window.getMostUsedRocket = getMostUsedRocket;
      window.getAverageMissionsPerYear = getAverageMissionsPerYear;
    }
  }, [csvData]);

  const filteredData = useMemo(() => {
    if (!csvData) return [];
    return csvData.filter(m => {
      if (filters.company && m.Company !== filters.company) return false;
      if (filters.status && m.MissionStatus !== filters.status) return false;
      if (filters.startDate && m.Date < filters.startDate) return false;
      if (filters.endDate && m.Date > filters.endDate) return false;
      return true;
    });
  }, [csvData, filters]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const stats = useMemo(() => {
    if (!filteredData.length) return {};
    const successCount = filteredData.filter(m => m.MissionStatus === 'Success').length;
    return {
      total: filteredData.length,
      successRate: ((successCount / filteredData.length) * 100).toFixed(2)
    };
  }, [filteredData]);

  // missions by yr line
  const missionsByYear = useMemo(() => {
  if (!filteredData.length) return [];
  const years = {};
  filteredData.forEach(m => {
    if (m.Date) {
      const yr = m.Date.substring(0, 4);
      years[yr] = (years[yr] || 0) + 1;
    }
  });
  return Object.entries(years).map(([yr, cnt]) => ({ year: yr, missions: cnt })).sort((a, b) => a.year.localeCompare(b.year));
}, [filteredData]);

  // top 10 bar
  const topCompanies = useMemo(() => {
    if (!filteredData.length) return [];
    const counts = {};
    filteredData.forEach(m => {
      counts[m.Company] = (counts[m.Company] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([comp, cnt]) => ({ company: comp, missions: cnt }));
  }, [filteredData]);

  // status pie
  const statusData = useMemo(() => {
    if (!filteredData.length) return [];
    const counts = {};
    filteredData.forEach(m => {
      counts[m.MissionStatus] = (counts[m.MissionStatus] || 0) + 1;
    });
    return Object.entries(counts).map(([status, cnt]) => ({ name: status, value: cnt }));
  }, [filteredData]);

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (!csvData) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Space Missions Dashboard</h1>
        <div className="border-2 border-dashed rounded p-8 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="mb-4"
          />
          <p className="text-gray-600">Upload space_missions.csv to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Space Missions Dashboard</h1>
      
      {/* summ */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-600 text-sm">Total Missions</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-600 text-sm">Success Rate</div>
          <div className="text-2xl font-bold">{stats.successRate}%</div>
        </div>
      </div>

      {/* filters */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-bold mb-3">Filters</h2>
        <div className="grid grid-cols-4 gap-3">
          <select 
            className="border p-2 rounded"
            value={filters.company}
            onChange={e => setFilters(prev => ({ ...prev, company: e.target.value }))}
          >
            <option value="">All Companies</option>
            {[...new Set(csvData.map(m => m.Company))].sort().map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select 
            className="border p-2 rounded"
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
            <option value="Partial Failure">Partial Failure</option>
            <option value="Prelaunch Failure">Prelaunch Failure</option>
          </select>
          <input 
            type="date"
            className="border p-2 rounded"
            value={filters.startDate}
            onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            placeholder="Start Date"
          />
          <input 
            type="date"
            className="border p-2 rounded"
            value={filters.endDate}
            onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            placeholder="End Date"
          />
        </div>
      </div>

      {/* visuals */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        {/* line */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-2">Missions Over Time</h2>
          <p className="text-sm text-gray-600 mb-3">Shows the trend of space missions launched each year. This line chart helps identify peak periods of space activity and long-term trends in launch frequency.</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={missionsByYear}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="missions" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* bar */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-2">Top 10 Companies by Mission Count</h2>
          <p className="text-sm text-gray-600 mb-3">Compares mission counts across the most active space organizations. This horizontal bar chart makes it easy to see which companies dominate space exploration.</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCompanies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="company" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="missions" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* pie */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-2">Mission Status Distribution</h2>
          <p className="text-sm text-gray-600 mb-3">Shows the proportion of successful vs failed missions. This pie chart provides a quick visual understanding of overall mission reliability.</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                {statusData.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* table */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-3">Mission Data ({sortedData.length} missions)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('Company')}>Company</th>
                <th className="p-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('Date')}>Date</th>
                <th className="p-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('Mission')}>Mission</th>
                <th className="p-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('Rocket')}>Rocket</th>
                <th className="p-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('MissionStatus')}>Status</th>
                <th className="p-2 text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.slice(0, 100).map((m, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-2">{m.Company}</td>
                  <td className="p-2">{m.Date}</td>
                  <td className="p-2">{m.Mission}</td>
                  <td className="p-2">{m.Rocket}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      m.MissionStatus === 'Success' ? 'bg-green-100 text-green-800' :
                      m.MissionStatus === 'Failure' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {m.MissionStatus}
                    </span>
                  </td>
                  <td className="p-2">{m.Location}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedData.length > 100 && (
            <p className="text-gray-500 text-sm mt-2">Showing first 100 of {sortedData.length} missions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpaceMissionsDashboard;