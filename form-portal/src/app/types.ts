export interface FormData {
  name: string;
  email: string;
  phone: string;
  industry: string;
  industryId: string;
  unitIds: string[];
  issueType: string;
  issueOption: string;
  inaccuracyReason: string;
  missingTimeline: string;
  description: string;
  photoUrl: string;
  fileName: string;
}

export interface Unit {
  id: string;
  name: string;
}

export interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  industry?: string;
  issueType?: string;
  issueOption?: string;
  inaccuracyReason?: string;
  missingTimeline?: string;
  description?: string;
}
