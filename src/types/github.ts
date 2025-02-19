
export interface ProcessResponse {
  response: string;
  languages: string[];
  github_url: string;
  num_repositories: number;
  animal_selection: string[];
  status: 'success' | 'error';
  error?: string;
}

export interface GenerateImageResponse {
  image_url: string;
  status: 'success' | 'error';
  error?: string;
}
