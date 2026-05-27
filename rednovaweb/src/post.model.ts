export interface UserSummary {
  id?: string;
  _id?: string;
  username: string;
}

export interface Forum {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface Subforum {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface Post {
  id?: string;
  _id?: string;
  title: string;
  content: string;
  author?: UserSummary;
  authorId?: string;
  forum?: Forum;
  subforum?: Subforum;
  score?: number;
  createdAt?: string;
  updatedAt?: string;
}