// ─── User ─────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl?: string;
  avatarColor: string;
  bio?: string;
  role: 'STUDENT' | 'CREATOR' | 'ADMIN' | 'MODERATOR';
  isVerified: boolean;
  isCreator: boolean;
  creatorApproved: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

// ─── Course ────────────────────────────────────────────────────
export interface Course {
  id: string;
  creatorId: string;
  creator: Pick<User, 'id' | 'name' | 'avatarUrl' | 'avatarColor'>;
  title: string;
  slug: string;
  description: string;
  shortDesc?: string;
  category?: Category;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: 'DRAFT' | 'PUBLISHED' | 'PENDING_REVIEW' | 'ARCHIVED' | 'REJECTED' | 'PRIVATE';
  abbr: string;
  accentColor: string;
  thumbGrad?: string;
  thumbnailUrl?: string;
  price?: number;
  originalPrice?: number;
  isFree: boolean;
  tags: string[];
  requirements: string[];
  whatYouLearn: string[];
  totalDuration: number;
  totalLessons: number;
  totalModules: number;
  enrolledCount: number;
  avgRating: number;
  ratingCount: number;
  publishedAt?: string;
  createdAt: string;
  modules?: Module[];
  enrollment?: Enrollment | null;
  isEnrolled?: boolean;
  _count?: { enrollments: number; reviews: number };
}

// ─── Module ────────────────────────────────────────────────────
export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  isFree: boolean;
  lessons: Lesson[];
}

// ─── Lesson ────────────────────────────────────────────────────
export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  type: 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'EXERCISE' | 'LIVE' | 'CODE';
  order: number;
  duration: number;
  isFree: boolean;
  isPublished: boolean;
  muxPlaybackId?: string;
  videoUrl?: string;
  fileUrl?: string;
  content?: string;
  moduleTitle?: string;
}

// ─── Enrollment ────────────────────────────────────────────────
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completedLessons: number;
  lastLessonId?: string;
  completedAt?: string;
  enrolledAt: string;
  course?: Course;
}

// ─── Gamification ─────────────────────────────────────────────
export interface GamificationData {
  xp: number;
  level: number;
  totalXp: number;
  coins: number;
  streak: number;
  longestStreak: number;
  rank: number;
  weeklyXp: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  coursesCompleted: number;
  minutesStudied: number;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconKey: string;
  style?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legend';
  isSecret: boolean;
}

export interface ShopItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  type: 'avatar' | 'frame' | 'theme' | 'pet' | 'boost' | 'title';
  rarity: string;
  iconKey: string;
  imageUrl?: string;
}

export interface Mission {
  id: string;
  slug: string;
  title: string;
  description: string;
  goalType: string;
  goalValue: number;
  xpReward: number;
  coinReward: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

// ─── Community ────────────────────────────────────────────────
export interface FeedPost {
  id: string;
  authorId: string;
  author: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl' | 'avatarColor'>;
  body: string;
  imageUrl?: string;
  attachType?: string;
  attachData?: Record<string, any>;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  liked?: boolean;
  comments?: FeedComment[];
}

export interface FeedComment {
  id: string;
  postId: string;
  author: Pick<User, 'id' | 'name' | 'avatarUrl' | 'avatarColor'>;
  body: string;
  likeCount: number;
  createdAt: string;
  replies?: FeedComment[];
}

// ─── Category ─────────────────────────────────────────────────
export interface Category {
  id: string;
  slug: string;
  name: string;
  iconKey?: string;
  color?: string;
}

// ─── Payment ──────────────────────────────────────────────────
export interface PaymentOrder {
  id: string;
  courseId: string;
  course: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnailUrl' | 'abbr' | 'accentColor'>;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  provider: string;
  paidAt?: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// ─── Leaderboard ──────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl' | 'avatarColor'>;
  xp: number;
  level: number;
  streak: number;
}

// ─── API Response wrapper ─────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  timestamp: string;
}
