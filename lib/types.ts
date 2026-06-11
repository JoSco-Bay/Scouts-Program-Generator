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
