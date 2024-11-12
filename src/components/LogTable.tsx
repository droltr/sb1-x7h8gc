import React from 'react';
import { Shield, AlertTriangle, Info, CheckCircle, Loader2 } from 'lucide-react';
import type { FortigateLog } from '../services/fortigate';

interface LogTableProps {
  logs: FortigateLog[];
  isLoading: boolean;
}

const LogIcon = ({ level }: { level: FortigateLog['level'] }) => {
  switch (level) {
    case 'error':
      return <Shield className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-500" />;
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
  }
};

const LogTable: React.FC<LogTableProps> = ({ logs, isLoading }) => {
  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Level
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Message
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <LogIcon level={log.level} />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {log.timestamp}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {log.source}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">
                {log.message}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${log.action === 'blocked' ? 'bg-red-100 text-red-800' : 
                    log.action === 'monitored' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'}`}>
                  {log.action}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogTable;