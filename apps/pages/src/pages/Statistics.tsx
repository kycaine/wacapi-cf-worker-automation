import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AnalyticsChart from '../components/AnalyticsChart';
import api from '../services/api';

const Statistics: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/api/stats/daily');
      setStats(statsRes.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="text-red-800 font-medium">Error</h3>
        <p className="text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  const chartData = [
    {
      date: stats?.date || new Date().toISOString().split('T')[0],
      inbound: stats?.total_inbound || 0,
      outbound: stats?.total_outbound || 0
    }
  ];

  return (
    <div className="space-y-6">
      <AnalyticsChart data={chartData} />
    </div>
  );
};

export default Statistics;
