import api from "./axios";

export const lessonAPI = {
  getByCourse: async (course_id: number) => {
    const res = await api.get(`/lesson/course/${course_id}`);
    return res.data;
  },

  getById: async (id: number) => {
    const res = await api.get(`/lesson/${id}`);
    return res.data;
  },

  create: async (data: {
    courseId: number;
    title: string;
    description?: string | null;
    videoUrl?: string | null;
    videoDuration?: number | null;
    text?: string | null;
    lessonOrder: number;
  }) => {
    const res = await api.post("/lesson/create", data);
    return res.data;
  },

  update: async (
    id: number,
    data: {
      title: string;
      description?: string | null;
      videoUrl?: string | null;
      videoDuration?: number | null;
      text?: string | null;
      lessonOrder: number;
    },
  ) => {
    const res = await api.patch(`/lesson/update/${id}`, data);
    return res.data;
  },

  uploadVideo: async (
    id: number,
    file: File,
    onProgress?: (progress: number) => void,
    durationSeconds?: number | null,
  ) => {
    const formData = new FormData();
    // Файлын ӨМНӨ нэмнэ — сервер талд busboy талбаруудыг ирсэн дарааллаар нь
    // задалдаг тул текст талбар нь файлын ард үлдвэл боловсруулалт удаан болно.
    // Сервер дээр ffprobe унасан үед энэ утга нөөц болж ашиглагдана.
    if (durationSeconds != null && durationSeconds > 0) {
      formData.append("duration", String(Math.round(durationSeconds)));
    }
    formData.append("video", file);

    const response = await api.post(`/lesson/${id}/upload-video`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 3600000, // 1 hour for large video uploads
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  publish: async (id: number) => {
    const res = await api.patch(`/lesson/${id}/publish`);
    return res.data;
  },

  deleteVideo: async (id: number) => {
    const res = await api.delete(`/lesson/${id}/video`);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await api.delete(`/lesson/${id}`);
    return res.data;
  },

  reorder: async (courseId: number, lessonOrder: number[]) => {
    const res = await api.patch(`/lesson/${courseId}/reorder`, {
      lessonOrder,
    });
    return res.data;
  },
};
