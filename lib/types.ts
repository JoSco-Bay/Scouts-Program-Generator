import type { Section } from './colours';

export interface GroupConfig {
  groupName: string;
  section: Section;
  meetingDay: string;
  meetingTime: string;
  leaders: string[];
  members: string[];
}

export interface TermRow {
  id: string;
  date: string;
  time: string;
  topic: string;
  location: string;
  oasFocus: string;
  sessionNotes: string;
  bring: string;
  leader: string;
  assistantPatrol: string;
  consentRequired: boolean;
  rowType: 'session' | 'extra';
}

export interface ActivityRow {
  id: string;
  time: string;
  name: string;
  detail: string;
  oasTag?: string;
  hasRecipe?: boolean;
  optional?: boolean;
}

export interface SIAEntry {
  category: string;
  projectName: string;
  status: 'planning' | 'in-progress' | 'complete';
  notes: string;
  dateCompleted?: string;
}

export interface MilestoneActivity {
  sessionId: string;
  sessionDate: string;
  challengeArea: string;
  type: 'assist' | 'lead';
  milestone: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  yearJoined: number;
  attendance: Record<string, boolean>;
  oas: Record<string, number>;
  sia: SIAEntry[];
  milestoneActivities: MilestoneActivity[];
  milestonesAwarded: string[];
  peakAwarded: boolean;
}

export interface RunSheetData {
  tagline?: string;
  challengeAreas?: string[];
  plan?: string[];
  activities: ActivityRow[];
  review?: string[];
  participate?: string[];
  assist?: string[];
  lead?: string[];
  itemsRequired?: string[];
}

export interface SavedRunSheet {
  data: RunSheetData;
  row: TermRow;
  config: GroupConfig;
}
