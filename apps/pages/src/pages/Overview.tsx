import React, { useEffect, useState } from 'react';
import { Users, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import UsageProgressBar from '../components/UsageProgressBar';
import api from '../services/api';

const Overview: React.FC = () => {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard 
          title="Unique Senders Today" 
          value={stats?.unique_senders_count || 0} 
          icon={Users} 
        />
        <MetricCard 
          title="Inbound Messages" 
          value={stats?.total_inbound || 0} 
          icon={ArrowDownRight} 
          subtitle="Received from users"
        />
        <MetricCard 
          title="Outbound Messages" 
          value={stats?.total_outbound || 0} 
          icon={ArrowUpRight} 
          subtitle="Sent by bot"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <UsageProgressBar 
          current={stats?.unique_senders_count || 0} 
          max={250} 
          label="Meta Tier 0 Daily Limit" 
        />
      </div>
    </div>
  );
};

export default Overview;
