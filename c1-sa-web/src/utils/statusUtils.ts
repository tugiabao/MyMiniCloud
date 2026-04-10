export type StatusColor = 'green' | 'orange' | 'red';

interface Threshold {
  min?: number;
  max?: number;
}

/**
 * Xác định màu trạng thái dựa trên giá trị và ngưỡng
 * @param value Giá trị hiện tại
 * @param threshold Cấu hình ngưỡng { min, max }
 * @param warningBuffer Khoảng đệm cảnh báo (VD: 1-2 đơn vị)
 */
export const getStatusColor = (
  value: number, 
  threshold?: Threshold, 
  warningBuffer: number = 1.0
): { colorClass: string; status: StatusColor } => {
  if (!threshold) return { colorClass: 'text-slate-800 dark:text-white', status: 'green' }; // Mặc định nếu chưa có cấu hình

  const { min, max } = threshold;

  // 1. Kiểm tra Vượt ngưỡng (ĐỎ)
  if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
    return { colorClass: 'text-red-500 animate-pulse', status: 'red' };
  }

  // 2. Kiểm tra Gần ngưỡng (CAM)
  // Gần Min: [min, min + buffer]
  if (min !== undefined && value <= min + warningBuffer) {
    return { colorClass: 'text-orange-500', status: 'orange' };
  }
  // Gần Max: [max - buffer, max]
  if (max !== undefined && value >= max - warningBuffer) {
    return { colorClass: 'text-orange-500', status: 'orange' };
  }

  // 3. An toàn (XANH)
  return { colorClass: 'text-green-500', status: 'green' };
};
