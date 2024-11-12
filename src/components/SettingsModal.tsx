import React, { useState, useEffect } from 'react';
import { X, Save, TestTube, Loader2 } from 'lucide-react';
import { FortigateService } from '../services/fortigate';
import { saveSettings, saveMockMode } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LogSettings;
  onSave: (settings: LogSettings) => void;
}

export interface LogSettings {
  host: string;
  port: string;
  protocol: 'http' | 'https';
  username: string;
  password: string;
  refreshInterval: number;
}

const defaultFormData: LogSettings = {
  host: '',
  port: '443',
  protocol: 'https',
  username: '',
  password: '',
  refreshInterval: 30,
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<LogSettings>(defaultFormData);
  const [testStatus, setTestStatus] = useState<{ message: string; success?: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [useMockData, setUseMockData] = useState(true);

  useEffect(() => {
    // Update form data when settings change
    setFormData(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
    saveMockMode(useMockData);
    onSave(formData);
    onClose();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestStatus({ message: 'Testing connection...' });

    try {
      const service = new FortigateService(formData, useMockData);
      const result = await service.testConnection();
      setTestStatus(result);
    } catch (error) {
      setTestStatus({
        success: false,
        message: 'Connection failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Connection Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="mockMode"
              checked={useMockData}
              onChange={(e) => setUseMockData(e.target.checked)}
              className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700"
            />
            <label htmlFor="mockMode" className="text-sm text-gray-300">
              Use Mock Data (for testing)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fortigate Host
            </label>
            <input
              type="text"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="192.168.1.1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Port
            </label>
            <input
              type="text"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="443"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Protocol
            </label>
            <select
              value={formData.protocol}
              onChange={(e) => setFormData({ ...formData, protocol: e.target.value as 'http' | 'https' })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="https">HTTPS</option>
              <option value="http">HTTP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              value={formData.refreshInterval}
              onChange={(e) => setFormData({ ...formData, refreshInterval: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="3600"
              required
            />
          </div>

          {testStatus && (
            <div className={`p-3 rounded-md ${
              testStatus.success === undefined ? 'bg-gray-700' :
              testStatus.success ? 'bg-green-900/50' : 'bg-red-900/50'
            }`}>
              <p className="text-sm">{testStatus.message}</p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;