import React, { useState, useCallback, useEffect } from 'react';
import { Activity, AlertTriangle, Wifi, Shield } from 'lucide-react';
import LogTable from './components/LogTable';
import StatCard from './components/StatCard';
import Header from './components/Header';
import SettingsModal, { LogSettings } from './components/SettingsModal';
import { useFortigateLogs } from './hooks/useFortigateLogs';
import { loadSettings } from './services/storage';

const defaultSettings: LogSettings = {
  host: '',
  port: '443',
  protocol: 'https',
  username: '',
  password: '',
  refreshInterval: 30,
};

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<LogSettings>(() => {
    return loadSettings<LogSettings>() || defaultSettings;
  });

  useEffect(() => {
    // Open settings modal if no configuration exists
    if (!settings.host || !settings.username) {
      setIsSettingsOpen(true);
    }
  }, [settings]);

  const { logs, error, isLoading } = useFortigateLogs(settings);

  const handleSaveSettings = useCallback((newSettings: LogSettings) => {
    setSettings(newSettings);
  }, []);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Threats"
            value={logs.filter(log => log.level === 'error').length}
            icon={AlertTriangle}
            trend={-5}
          />
          <StatCard
            title="Network Load"
            value={`${Math.floor(Math.random() * 100)}%`}
            icon={Activity}
            trend={8}
          />
          <StatCard
            title="Active Sessions"
            value={logs.length}
            icon={Wifi}
            trend={3}
          />
          <StatCard
            title="Blocked Attempts"
            value={logs.filter(log => log.action === 'blocked').length}
            icon={Shield}
            trend={12}
          />
        </div>

        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Real-time Logs</h2>
            {error && (
              <p className="mt-2 text-red-400 text-sm">{error}</p>
            )}
          </div>
          <LogTable logs={filteredLogs} isLoading={isLoading} />
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default App;