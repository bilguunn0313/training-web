// export interface Courses {
//   id: number;
//   title: string;
//   description: string;
//   department: string;
//   teacher: string;
//   videos: number;
//   duration: string;
// }

export interface UserType {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin" | "chief" | "supervisor" | "accountant";
  avatar_url?: string;
}
