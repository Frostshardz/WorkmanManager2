// In-memory storage for the application
export interface User {
  id: string;
  email: string;
  password: string; // In production, this would be hashed
  role: 'admin' | 'supervisor' | 'employee';
  isActive: boolean;
  apiToken?: string;
  createdAt: Date;
}

export interface Workman {
  trn: string;
  name: string;
  company: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  workmanTrn: string;
  clockIn: Date;
  clockOut?: Date;
  notes?: string;
}

// In-memory storage
class MemoryStorage {
  private users: Map<string, User> = new Map();
  private workmen: Map<string, Workman> = new Map();
  private timeEntries: Map<string, TimeEntry> = new Map();
  private currentUser: User | null = null;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default admin user
    const adminUser: User = {
      id: '1',
      email: 'admin@example.com',
      password: 'admin123', // In production, this would be hashed
      role: 'admin',
      isActive: true,
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample workmen
    const sampleWorkmen: Workman[] = [
      {
        trn: 'TRN001',
        name: 'John Smith',
        company: 'ABC Construction',
        location: 'Kingston',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        trn: 'TRN002',
        name: 'Maria Garcia',
        company: 'Elite Builders',
        location: 'Spanish Town',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        trn: 'TRN003',
        name: 'David Brown',
        company: 'Pro Construction',
        location: 'Portmore',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleWorkmen.forEach(workman => {
      this.workmen.set(workman.trn, workman);
    });
  }

  // User methods
  login(email: string, password: string): User | null {
    const user = Array.from(this.users.values()).find(u => u.email === email && u.password === password);
    if (user && user.isActive) {
      this.currentUser = user;
      return user;
    }
    return null;
  }

  register(email: string, password: string, role: 'admin' | 'supervisor' | 'employee' = 'employee'): User {
    const id = (this.users.size + 1).toString();
    const user: User = {
      id,
      email,
      password, // In production, this would be hashed
      role,
      isActive: true,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  logout() {
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Workmen methods
  getAllWorkmen(): Workman[] {
    return Array.from(this.workmen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getWorkmanByTrn(trn: string): Workman | null {
    return this.workmen.get(trn) || null;
  }

  addWorkman(workman: Omit<Workman, 'createdAt' | 'updatedAt'>): Workman {
    if (this.workmen.has(workman.trn)) {
      throw new Error('TRN already exists');
    }
    
    const newWorkman: Workman = {
      ...workman,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.workmen.set(workman.trn, newWorkman);
    return newWorkman;
  }

  updateWorkman(trn: string, updates: Partial<Omit<Workman, 'trn' | 'createdAt'>>): Workman | null {
    const workman = this.workmen.get(trn);
    if (!workman) return null;

    const updatedWorkman = {
      ...workman,
      ...updates,
      updatedAt: new Date()
    };
    
    this.workmen.set(trn, updatedWorkman);
    return updatedWorkman;
  }

  deleteWorkman(trn: string): boolean {
    // Also delete related time entries
    const timeEntriesToDelete = Array.from(this.timeEntries.values())
      .filter(entry => entry.workmanTrn === trn);
    
    timeEntriesToDelete.forEach(entry => {
      this.timeEntries.delete(entry.id);
    });

    return this.workmen.delete(trn);
  }

  searchWorkmen(query: string): Workman[] {
    if (!query.trim()) return this.getAllWorkmen();
    
    const lowerQuery = query.toLowerCase();
    return Array.from(this.workmen.values())
      .filter(workman => 
        workman.name.toLowerCase().includes(lowerQuery) ||
        workman.company.toLowerCase().includes(lowerQuery) ||
        workman.location.toLowerCase().includes(lowerQuery) ||
        workman.trn.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Time tracking methods
  clockIn(workmanTrn: string, notes?: string): TimeEntry {
    // Check if already clocked in
    const activeEntry = Array.from(this.timeEntries.values())
      .find(entry => entry.workmanTrn === workmanTrn && !entry.clockOut);
    
    if (activeEntry) {
      throw new Error('Workman is already clocked in');
    }

    const id = Date.now().toString();
    const timeEntry: TimeEntry = {
      id,
      workmanTrn,
      clockIn: new Date(),
      notes
    };

    this.timeEntries.set(id, timeEntry);
    return timeEntry;
  }

  clockOut(workmanTrn: string, notes?: string): TimeEntry {
    const activeEntry = Array.from(this.timeEntries.values())
      .find(entry => entry.workmanTrn === workmanTrn && !entry.clockOut);
    
    if (!activeEntry) {
      throw new Error('No active clock-in found');
    }

    const updatedEntry: TimeEntry = {
      ...activeEntry,
      clockOut: new Date(),
      notes: notes ? (activeEntry.notes ? `${activeEntry.notes} | ${notes}` : notes) : activeEntry.notes
    };

    this.timeEntries.set(activeEntry.id, updatedEntry);
    return updatedEntry;
  }

  getWorkmanStatus(trn: string): 'clocked_in' | 'clocked_out' {
    const activeEntry = Array.from(this.timeEntries.values())
      .find(entry => entry.workmanTrn === trn && !entry.clockOut);
    
    return activeEntry ? 'clocked_in' : 'clocked_out';
  }

  getWorkmanTimeEntries(trn: string): TimeEntry[] {
    return Array.from(this.timeEntries.values())
      .filter(entry => entry.workmanTrn === trn)
      .sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime());
  }

  getAllTimeEntries(): TimeEntry[] {
    return Array.from(this.timeEntries.values())
      .sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime());
  }

  getLocationGroups(): Record<string, Workman[]> {
    const groups: Record<string, Workman[]> = {};
    
    this.getAllWorkmen().forEach(workman => {
      if (!groups[workman.location]) {
        groups[workman.location] = [];
      }
      groups[workman.location].push(workman);
    });

    return groups;
  }
}

// Create singleton instance
export const storage = new MemoryStorage();

// Helper functions
export const calculateDuration = (clockIn: Date, clockOut?: Date): number => {
  if (!clockOut) return 0;
  return (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60); // hours
};

export const formatDuration = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m}m`;
};