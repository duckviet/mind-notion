export type TemplateFormData = {
  name: string;
  icon: string;
  content: string;
  tags: string[];
  color?: string;
};

export type TemplateResponse = {
  id: string;
  name: string;
  icon: string;
  content: string;
  tags: string[];
  color?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};
