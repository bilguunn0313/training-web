// components/lesson/CreateEditLessonDialog.tsx
"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Plus, Upload, X, Video, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { lessonAPI } from "@/lib/lesson";
import { Lesson } from "@/types/schema.types";
import { PdfUploadZone } from "./PdfUploadZone";
import { Progress } from "@/components/ui/progress";
import { pdfAPI } from "@/lib/pdf";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CreateEditLessonDialogProps {
  courseId: number;
  lesson?: Lesson;
  onSuccess: () => void;
  trigger?: ReactNode;
}

export function CreateEditLessonDialog({
  courseId,
  lesson,
  onSuccess,
  trigger,
}: CreateEditLessonDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [text, setText] = useState("");
  const [lessonOrder, setLessonOrder] = useState("");
  const [pdfMaterials, setPdfMaterials] = useState<any[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  // Файл 100% илгээгдсэний дараа сервер тал дээр remux/хугацаа тооцоолол
  // ажилладаг. Энэ хугацаанд progress bar гацсан мэт харагдахаас сэргийлнэ.
  const [processing, setProcessing] = useState(false);
  const [pendingPdfFiles, setPendingPdfFiles] = useState<File[]>([]);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [existingVideoDuration, setExistingVideoDuration] = useState<
    number | null
  >(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

  const isEdit = !!lesson;

  // Reset form when dialog opens for new lesson, populate when editing
  useEffect(() => {
    if (open) {
      if (lesson) {
        setTitle(lesson.title);
        setDescription(lesson.description || "");
        setVideoUrl(lesson.video_url || "");
        setVideoDuration(lesson.video_duration?.toString() || "");
        setText(lesson.text || "");
        setLessonOrder(lesson.lesson_order.toString());
        setExistingVideoUrl(lesson.video_url || null);
        setExistingVideoDuration(lesson.video_duration ?? null);

        // Load PDF materials for editing
        if (lesson.id) {
          loadPdfMaterials(lesson.id);
        }
      } else {
        // Reset form for new lesson
        resetForm();
      }
    }
  }, [lesson, open]);

  const loadPdfMaterials = async (lessonId: number) => {
    try {
      const result = await pdfAPI.getByLesson(lessonId);
      setPdfMaterials(result.data || []);
    } catch (error) {
      console.error("Error loading PDF materials:", error);
    }
  };

  const handleVideoFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast.error(
        "Видео файл 500MB-аас бага байх ёстой. HandBrake ашиглан багасгана уу.",
      );
      e.target.value = "";
      return;
    }

    // Check file type
    if (!file.type.startsWith("video/")) {
      toast.error("Зөвхөн видео файл оруулах боломжтой");
      e.target.value = "";
      return;
    }

    setVideoFile(file);

    // Auto-detect duration
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const durationInSeconds = Math.round(video.duration);
      setVideoDuration(durationInSeconds.toString());
      window.URL.revokeObjectURL(video.src);
      toast.success(
        `Видео хугацаа: ${Math.floor(durationInSeconds / 60)} мин ${durationInSeconds % 60} сек`,
      );
    };
    video.onerror = () => {
      toast.error("Видео файлыг уншиж чадсангүй");
      setVideoFile(null);
      e.target.value = "";
    };
    video.src = URL.createObjectURL(file);
  };

  const handleRemoveVideoFile = () => {
    setVideoFile(null);
    setVideoDuration("");
    const fileInput = document.getElementById("videoFile") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handlePdfFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const pdfFiles = Array.from(files);
    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of pdfFiles) {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name} нь PDF файл биш байна`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} нь 10MB-аас их байна`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setPendingPdfFiles([...pendingPdfFiles, ...validFiles]);
      toast.success(`${validFiles.length} PDF файл нэмэгдлээ`);
    }

    e.target.value = "";
  };

  const handleRemovePendingPdf = (index: number) => {
    setPendingPdfFiles(pendingPdfFiles.filter((_, i) => i !== index));
  };

  const handleDeleteExistingVideo = async () => {
    if (!lesson?.id) return;
    setDeletingVideo(true);
    try {
      await lessonAPI.deleteVideo(lesson.id);
      setExistingVideoUrl(null);
      setExistingVideoDuration(null);
      setVideoDuration("");
      toast.success("Видео амжилттай устгагдлаа");
      onSuccess();
      router.refresh();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Видео устгахад алдаа гарлаа",
      );
    } finally {
      setDeletingVideo(false);
    }
  };

  const formatVideoDurationLabel = (sec: number | null) => {
    if (!sec || sec <= 0) return "";
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins} мин ${secs} сек`;
  };

  const getVideoFileName = (url: string) => {
    const parts = url.split("/");
    return parts[parts.length - 1] || url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Хичээлийн нэр заавал оруулна уу");
      return;
    }

    // Video/text is now optional - PDF-only lessons are allowed

    setSaving(true);
    try {
      const data = {
        courseId,
        title,
        description: description || null,
        videoUrl: null, // Always null, we only use file upload
        videoDuration: videoDuration ? parseInt(videoDuration) : null,
        text: text || null,
        lessonOrder: parseInt(lessonOrder) || 1,
      };

      let lessonId: number;

      if (isEdit && lesson?.id) {
        await lessonAPI.update(lesson.id, data);
        lessonId = lesson.id;
        toast.success("Хичээл амжилттай шинэчлэгдлээ!");
      } else {
        const newLesson = await lessonAPI.create(data);
        lessonId = newLesson.id || newLesson.data?.id;
        toast.success("Хичээл амжилттай үүслээ!");
      }

      // Upload video file if provided
      if (videoFile && lessonId) {
        setUploading(true);
        try {
          const result = await lessonAPI.uploadVideo(
            lessonId,
            videoFile,
            (progress) => {
              setUploadProgress(progress);
              // 100% гэдэг нь файл серверт очсон гэсэн үг — цаана нь боловсруулалт
              // үргэлжилж байгааг хэрэглэгчид мэдэгдэнэ.
              if (progress >= 100) setProcessing(true);
            },
            videoDuration ? parseInt(videoDuration) : null,
          );
          toast.success("Видео амжилттай хуулагдлаа!");

          if (result?.warning) {
            toast.warning(result.warning, { duration: 10000 });
          }

          // Refresh the page to update the UI
          router.refresh();
        } catch (error: any) {
          console.error("Video upload error:", error);
          const errorMsg = error.response?.data?.message || error.message || "Видео хуулахад алдаа гарлаа";
          const statusCode = error.response?.status;

          if (statusCode === 413) {
            toast.error("Файлын хэмжээ хэтэрсэн байна (MAX 500MB)");
          } else if (statusCode === 504 || statusCode === 502) {
            toast.error("Сервер хугацаа хэтэрсэн (timeout). Nginx тохиргоо шалгана уу.");
          } else if (error.code === 'ECONNABORTED') {
            toast.error("Холболт тасарсан. Интернэт холболтоо шалгана уу.");
          } else {
            toast.error(`Алдаа: ${errorMsg}`);
          }
        } finally {
          setUploading(false);
          setProcessing(false);
          setUploadProgress(0);
        }
      }

      // Upload pending PDF files if any
      if (pendingPdfFiles.length > 0 && lessonId) {
        setUploading(true);
        try {
          for (const pdfFile of pendingPdfFiles) {
            await pdfAPI.uploadFile(lessonId, pdfFile, pdfFile.name);
          }
          toast.success(`${pendingPdfFiles.length} PDF файл амжилттай хуулагдлаа!`);

          // Refresh the page to update the UI
          router.refresh();
        } catch (error) {
          toast.error("PDF файл хуулахад алдаа гарлаа");
        } finally {
          setUploading(false);
        }
      }

      setOpen(false);
      onSuccess();
      resetForm();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Хичээл хадгалахад алдаа гарлаа",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setVideoDuration("");
    setText("");
    setLessonOrder("");
    setPdfMaterials([]);
    setVideoFile(null);
    setUploadProgress(0);
    setUploading(false);
    setPendingPdfFiles([]);
    setExistingVideoUrl(null);
    setExistingVideoDuration(null);
    setDeletingVideo(false);

    // Clear file inputs
    const videoInput = document.getElementById("videoFile") as HTMLInputElement;
    if (videoInput) videoInput.value = "";
    const pdfInput = document.getElementById("pdfFiles") as HTMLInputElement;
    if (pdfInput) pdfInput.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Хичээл нэмэх
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Хичээл засах" : "Шинэ хичээл үүсгэх"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Хичээлийн мэдээллийг шинэчлэх"
              : "Сургалтдаа шинэ хичээл нэмэх"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Хичээлийн нэр *</Label>
              <Input
                id="title"
                placeholder="жишээ нь: Хувьсагчийн танилцуулга"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Товч тайлбар</Label>
              <Textarea
                id="description"
                placeholder="Хичээлийн товч тайлбар"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lessonOrder">Хичээлийн дараалал *</Label>
              <Input
                id="lessonOrder"
                type="number"
                min="1"
                placeholder="1"
                value={lessonOrder}
                onChange={(e) => setLessonOrder(e.target.value)}
                required
              />
            </div>
          </div>
          {/* Video Content */}
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-4">Видео хуулах (заавал биш)</h4>

            <div className="space-y-4">
              {/* Existing video (edit mode, only when no new file is staged) */}
              {isEdit && existingVideoUrl && !videoFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Video className="h-4 w-4 text-green-700 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-green-900 truncate">
                          {getVideoFileName(existingVideoUrl)}
                        </p>
                        <p className="text-xs text-green-700">
                          Одоогийн видео
                          {existingVideoDuration
                            ? ` • ${formatVideoDurationLabel(existingVideoDuration)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={uploading || deletingVideo}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Устгах
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Видеог устгах уу?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Энэ хичээлийн видео файлыг бүрмөсөн устгана. Энэ
                            үйлдлийг буцаах боломжгүй.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Цуцлах</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteExistingVideo}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Устгах
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="videoFile">
                  {existingVideoUrl
                    ? "Видео солих (MAX 500MB)"
                    : "Видео файл (MAX 500MB)"}
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("videoFile")?.click()}
                    disabled={uploading || deletingVideo}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {videoFile
                      ? "Өөр файл сонгох"
                      : existingVideoUrl
                        ? "Шинэ видеогоор солих"
                        : "Видео файл сонгох"}
                  </Button>
                  <input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    disabled={uploading || deletingVideo}
                    className="hidden"
                  />
                </div>
              </div>

              {videoFile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {videoFile.name}
                        </p>
                        <p className="text-xs text-blue-700">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                          {videoDuration &&
                            ` • ${Math.floor(parseInt(videoDuration) / 60)} мин ${parseInt(videoDuration) % 60} сек`}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setVideoFile(null);
                        setVideoDuration("");
                        const fileInput = document.getElementById(
                          "videoFile",
                        ) as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                      }}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {processing
                        ? "Сервер боловсруулж байна..."
                        : "Видео хуулж байна..."}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                  {processing && (
                    <p className="text-xs text-muted-foreground">
                      Видеог вэбэд тохируулж байна. Энэ цонхыг хаахгүй байна уу —
                      том файлын хувьд хэдэн минут үргэлжилж болно.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* PDF Upload Section for New Lessons */}
          {!isEdit && (
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">PDF Материал нэмэх (заавал биш)</h4>
              <p className="text-sm text-gray-500 mb-3">
                Хичээлд хавсаргах PDF материалаа сонгоно уу (MAX 10MB)
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("pdfFiles")?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    PDF файл сонгох
                  </Button>
                  <input
                    id="pdfFiles"
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handlePdfFilesChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>

                {pendingPdfFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Сонгосон PDF файлууд ({pendingPdfFiles.length})</Label>
                    {pendingPdfFiles.map((file, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">
                                {file.name}
                              </p>
                              <p className="text-xs text-blue-700">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePendingPdf(index)}
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Text Content - Optional */}
          {/* <div className="border-t pt-6">
            <h4 className="font-semibold mb-4">
              Нэмэлт текст контент (заавал биш)
            </h4>
            <p className="text-sm text-gray-500 mb-3">
              Хичээлийн дэлгэрэнгүй тайлбар, код жишээ, тэмдэглэл гэх мэт
            </p>

            <div className="space-y-2">
              <Label htmlFor="text">Хичээлийн текст</Label>
              <Textarea
                id="text"
                placeholder="Хичээлийн дэлгэрэнгүй агуулга..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
              />
            </div>
          </div> */}

          {/* PDF Upload Zone for Editing Lessons */}
          {lesson?.id && (
            <div className="border-t pt-6">
              <PdfUploadZone
                lessonId={lesson.id}
                materials={pdfMaterials}
                onMaterialsUpdate={setPdfMaterials}
              />
            </div>
          )}
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              Цуцлах
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              <Save className="mr-2 h-4 w-4" />
              {uploading
                ? "Видео хуулж байна..."
                : saving
                  ? "Хадгалж байна..."
                  : isEdit
                    ? "Шинэчлэх"
                    : "Үүсгэх"}
            </Button>
          </div>
          {/* Note for new lessons */}
          {!isEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Анхаар:</strong> Хичээл нь зөвхөн PDF, зөвхөн видео, эсвэл хоёуланд нь агуулгатай байж болно. Сонгосон файлууд хичээл үүсгэсний дараа автоматаар хуулагдана.
              </p>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
