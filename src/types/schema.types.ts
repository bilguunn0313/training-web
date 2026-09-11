export interface Subject {
  id: number;
  description: string | null;
  title: string;
  created_at: string;
  updated_at?: string;
}

export interface Course {
  id: number;
  description: string | null;
  title: string;
  subject_id: number;
  user_id: number;
  thumbnail_url: string;
  views: number;
  published: boolean;
  created_at: string;
  updated_at?: string;
  // joined data
  user_name?: string;
  subject_name?: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string | null;
  course_id: number;
  lesson_order: number;
  video_url: string | null;
  video_duration: number | null;
  published: boolean;
  created_at: string;
  updated_at?: string;
  text: string | null;
}

export type MealSession = "breakfast" | "lunch";
export type MealChoice = "meal_1" | "meal_2" | "both";

export interface MenuItem {
  id: number;
  daily_menu_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  item_type: "meal_1" | "meal_2" | "drink";
  meal_session: MealSession;
  ingredients: string | null;
  calories: number | null;
  created_at: string;
  updated_at: string;
}

export interface DailyMenu {
  id: number;
  menu_date: string;
  created_by: number;
  created_by_name?: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: MenuItem[];
}

/**
 * Нэг сешний тоо. Хүмүүс маргаашийн төлөө kiosk дээр урьдчилан бүртгүүлдэг.
 *   people — хэдэн ХҮН иднэ
 *   meal_1 / meal_2 — хэдэн ПОРЦ чанах вэ ("both" нь хоёуланд ордог)
 * meal_1 + meal_2 нь people-ээс их байж болно; зөрүү нь "both" сонгосон
 * хүмүүсийн тоо. Алдаа биш.
 */
export interface MenuSessionCount {
  session: MealSession;
  people: number;
  meal_1: number;
  meal_2: number;
}

export interface MenuCount {
  breakfast: MenuSessionCount;
  lunch: MenuSessionCount;
}

export interface Dish {
  id: number;
  name: string;
  image_url: string | null;
  item_type: "meal_1" | "meal_2" | "drink";
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface TemperatureRecord {
  id: number;
  record_date: string;
  temperature: number;
  recorded_by: number;
  recorded_by_name?: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Car {
  id: number;
  license_plate: string;
  car_name: string | null;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TireCondition {
  id: number;
  car_id: number;
  record_date: string;
  condition: "good" | "fair" | "poor" | "critical";
  notes: string | null;
  recorded_by: number;
  recorded_by_name?: string;
  license_plate?: string;
  car_name?: string;
  created_at: string;
  updated_at: string;
}

export interface OdometerReading {
  id: number;
  car_id: number;
  record_date: string;
  reading_km: number;
  notes: string | null;
  recorded_by: number;
  recorded_by_name?: string;
  license_plate?: string;
  car_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ComputerSpec {
  id: number;
  odoo_asset_id: number;
  odoo_asset_code: string | null;
  odoo_asset_barcode: string | null;
  odoo_asset_name: string | null;
  descr: string | null;
  notes: string | null;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ComputerInspection {
  id: number;
  computer_spec_id: number;
  inspection_date: string;
  status: "pass" | "fail";
  notes: string | null;
  inspected_by: number;
  inspected_by_name?: string;
  odoo_asset_name?: string;
  odoo_asset_code?: string;
  odoo_asset_barcode?: string;
  created_at: string;
  updated_at: string;
}

export interface ComputerSpecWithInspection extends ComputerSpec {
  latest_inspection?: ComputerInspection | null;
}

export interface ComputerSpecHistory {
  id: number;
  computer_spec_id: number;
  descr: string | null;
  notes: string | null;
  created_by: number | null;
  created_by_name?: string;
  created_at: string;
}

export interface OdooAsset {
  id: number;
  name: string;
  code: string | false;
  barcode: string | false;
  state: string;
  category_id: [number, string];
  value: number;
  date: string;
  partner_id: [number, string] | false;
  user_id: [number, string] | false;
}

// Fleet vehicle from Odoo ERP
export interface FleetVehicle {
  id: number;
  name: string;
  license_plate: string;
  vin_sn: string;
  model_id: [number, string] | false;
  department_id: [number, string] | false;
  related_department_id: [number, string] | false;
  ownership_type: string;
  technical_config: string | null;
  car_type: string | null;
  sub_type: string | null;
  manufacture_date: string | null;
  color: string | null;
  program_code: string | null;
  related_asset: string | null;
  capacity: number;
  load_capacity: number;
  state_id: [number, string] | false;
  odometer: number;
}

export interface OdooDepartment {
  id: number;
  name: string;
  parent_id?: [number, string] | false;
}

export interface FleetVehicleState {
  id: number;
  name: string;
  sequence: number;
}

export interface FleetVehicleModel {
  id: number;
  name: string;
  brand_id: [number, string] | false;
}

export interface CreateVehicleData {
  license_plate: string;
  vin_sn?: string;
  model_id?: number | false;
  department_id?: number | false;
  related_department_id?: number | false;
  ownership_type?: string;
  technical_config?: string;
  car_type?: string;
  sub_type?: string;
  manufacture_date?: string;
  color?: string;
  program_code?: string;
  related_asset?: string;
  capacity?: number;
  load_capacity?: number;
  state_id?: number | false;
}

export type UpdateVehicleData = Partial<CreateVehicleData>;

// ── Inventory (хүнсний материалын нөөц) ──────────────────────────────────

export type TransactionType = "receipt" | "issue" | "adjustment";

export interface Material {
  id: number;
  name: string;
  unit: string;
  category: string | null;
  odoo_product_id: number | null;
  is_active: boolean;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialBalance {
  id: number;
  name: string;
  unit: string;
  category: string | null;
  balance: number;
  avg_price: number | null;
  balance_value: number;
}

export interface MaterialTransaction {
  id: number;
  material_id: number;
  tx_type: TransactionType;
  quantity: number;
  unit_price: number | null;
  tx_date: string;
  note: string | null;
  stock_count_id: number | null;
  created_by: number;
  created_by_name?: string;
  material_name?: string;
  material_unit?: string;
  created_at: string;
  updated_at: string;
}

export interface StockCount {
  id: number;
  count_date: string;
  period_year: number;
  period_month: number;
  status: "draft" | "closed";
  notes: string | null;
  created_by: number;
  created_by_name?: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockCountLine {
  id: number;
  stock_count_id: number;
  material_id: number;
  system_quantity: number;
  counted_quantity: number;
  difference: number;
  note: string | null;
  material_name?: string;
  material_unit?: string;
  material_category?: string | null;
}

export interface StockCountWithLines extends StockCount {
  lines: StockCountLine[];
}

export interface MonthlyReportRow {
  material_id: number;
  name: string;
  unit: string;
  category: string | null;
  opening_quantity: number;
  receipt_quantity: number;
  issue_quantity: number;
  adjustment_quantity: number;
  closing_quantity: number;
  avg_price: number | null;
  closing_value: number;
}
