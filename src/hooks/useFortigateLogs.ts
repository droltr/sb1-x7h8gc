import { useState, useEffect, useCallback } from 'react';
import { FortigateService, FortigateLog } from '../services/fortigate';
import { LogSettings } from '../components/SettingsModal';

export function useFortigateLogs(settings: LogSettings) {
  const [logs, setLogs] = useState<FortigateLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!settings.host || !settings.apiKey) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const service = new FortigateService(settings, true); // Enable mock mode
      const newLogs = await service.getLogs();
      setLogs(prevLogs => {
        // Merge new logs with existing ones, removing duplicates
        const combined = [...newLogs, ...prevLogs];
        const unique = combined.filter((log, index, self) =>
          index === self.findIndex(l => l.id === log.id)
        );
        // Keep only the latest 100 logs
        return unique.slice(0, 100);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  useEffect(() => {
    if (settings.host && settings.apiKey) {
      fetchLogs();
      const interval = setInterval(fetchLogs, settings.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [settings, fetchLogs]);

  return { logs, error, isLoading, refetch: fetchLogs };
}