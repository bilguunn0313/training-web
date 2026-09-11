// Admin TypeScript types for frontend

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUser {
  id: number;
  odoo_id: number;
  email: string;
  name: string;
  role: "user" | "admin" | "chief" | "supervisor" | "accountant";
  created_at: string;
  updated_at: string;
}

export interface AdminCourse {
  id: number;
  title: string;
  description: string | null;
  subject_id: number;
  subject_name: string;
  user_id: number;
  user_name: string;
  thumbnail_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminLesson {
  id: number;
  title: string;
  description: string | null;
  course_id: number;
  course_title: string;
  video_url: string | null;
  order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminSubject {
  id: number;
  title: string;
  description: string | null;
  course_count: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalLessons: number;
  totalSubjects: number;
  recentUsers: AdminUser[];
  recentCourses: AdminCourse[];
}

export interface UserStats {
  totalUsers: number;
  totalAdmins: number;
  totalRegularUsers: number;
  recentSignups: number;
}

export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  unpublishedCourses: number;
  totalEnrollments: number;
}

export interface LessonStats {
  totalLessons: number;
  publishedLessons: number;
  unpublishedLessons: number;
  avgLessonsPerCourse: number;
}

export interface SubjectStats {
  totalSubjects: number;
  subjectsWithCourses: number;
  avgCoursesPerSubject: number;
}

export interface UsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "admin" | "user" | "chief" | "supervisor" | "accountant";
}

export interface CoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  subjectId?: number;
  userId?: number;
  published?: boolean;
}

export interface LessonsParams {
  page?: number;
  limit?: number;
  search?: string;
  courseId?: number;
  published?: boolean;
}

export interface SubjectsParams {
  page?: number;
  limit?: number;
  search?: string;
}
