import axios, { AxiosError } from 'axios';
import { LogSettings } from '../components/SettingsModal';

export interface FortigateLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'success';
  source: string;
  message: string;
  action: string;
}

export class FortigateService {
  private retryCount: number = 0;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000;
  private readonly timeout: number = 10000;
  private token: string | null = null;

  constructor(
    private settings: LogSettings,
    private useMockData: boolean = false
  ) {}

  private get baseURL(): string {
    return `${this.settings.protocol}://${this.settings.host}:${this.settings.port}/api/v2`;
  }

  private async login(): Promise<string> {
    const response = await axios.post(
      `${this.baseURL}/authentication`, 
      {
        username: this.settings.username,
        password: this.settings.password,
        client_id: 'fortigate_monitor',
        grant_type: 'password'
      },
      { timeout: this.timeout }
    );

    if (!response.data?.access_token) {
      throw new Error('Authentication failed: No access token received');
    }

    return response.data.access_token;
  }

  private async getToken(): Promise<string> {
    if (!this.token) {
      this.token = await this.login();
    }
    return this.token;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private handleAxiosError(error: AxiosError): string {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          this.token = null; // Clear invalid token
          return 'Invalid credentials or session expired';
        case 403:
          return 'Access forbidden - check your permissions';
        case 404:
          return 'API endpoint not found - check your Fortigate version';
        case 500:
          return 'Fortigate internal server error';
        default:
          return `Server error: ${error.response.status}`;
      }
    }
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused - check if the device is reachable';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Connection timed out - check your network or device status';
    }
    return error.message;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (this.useMockData) {
      return { success: true, message: 'Connection successful (Mock Mode)' };
    }

    try {
      // Try to authenticate
      await this.getToken();

      // If successful, try to get a sample log to verify permissions
      await axios.get(`${this.baseURL}/monitor/log/system`, {
        headers: await this.getHeaders(),
        timeout: this.timeout,
        params: {
          limit: 1,
        },
      });

      return { 
        success: true, 
        message: 'Connection successful - API access verified' 
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        return {
          success: false,
          message: `Connection failed: ${this.handleAxiosError(error)}`,
        };
      }
      return { 
        success: false, 
        message: 'Connection failed: Unknown error' 
      };
    }
  }

  async getLogs(): Promise<FortigateLog[]> {
    if (this.useMockData) {
      return this.generateMockLogs();
    }

    try {
      const response = await this.makeRequest();
      return this.processLogs(response.data.results || []);
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        await this.delay(this.retryDelay * this.retryCount);
        return this.getLogs();
      }
      
      this.retryCount = 0;
      if (error instanceof AxiosError) {
        throw new Error(`Failed to fetch logs: ${this.handleAxiosError(error)}`);
      }
      throw error;
    }
  }

  private async makeRequest() {
    const params = {
      limit: 100,
      sort: '-timestamp',
      filter: 'action==blocked || level==critical || level==warning',
    };

    return await axios.get(`${this.baseURL}/monitor/log/system`, {
      headers: await this.getHeaders(),
      timeout: this.timeout,
      params,
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateMockLogs(): FortigateLog[] {
    const mockEvents = [
      { level: 'error', message: 'Failed login attempt detected', action: 'blocked' },
      { level: 'warning', message: 'Unusual traffic pattern detected', action: 'monitored' },
      { level: 'info', message: 'VPN connection established', action: 'allowed' },
      { level: 'error', message: 'Port scan detected', action: 'blocked' },
      { level: 'warning', message: 'High CPU usage detected', action: 'monitored' },
    ];

    return mockEvents.map((event, index) => ({
      id: String(Date.now() + index),
      timestamp: new Date().toISOString(),
      level: event.level as FortigateLog['level'],
      source: `192.168.1.${100 + Math.floor(Math.random() * 100)}`,
      message: event.message,
      action: event.action,
    }));
  }

  private processLogs(logs: any[]): FortigateLog[] {
    return logs.map(log => ({
      id: String(log.id || Date.now()),
      timestamp: new Date(log.timestamp * 1000).toISOString(),
      level: this.mapLogLevel(String(log.level || 'info')),
      source: String(log.source_ip || log.source || ''),
      message: String(log.msg || log.message || ''),
      action: String(log.action || 'info'),
    }));
  }

  private mapLogLevel(level: string): FortigateLog['level'] {
    switch (level.toLowerCase()) {
      case 'critical':
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'notice':
      case 'information':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  }
}