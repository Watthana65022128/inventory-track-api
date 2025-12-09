export enum PrStatus {
  DRAFT = 'DRAFT',           // สร้างใหม่ ยังแก้ไขได้
  PENDING = 'PENDING',       // ส่งขออนุมัติแล้ว
  APPROVED = 'APPROVED',     // PR_APPROVER อนุมัติแล้ว
  REJECTED = 'REJECTED',     // PR_APPROVER ปฏิเสธ
  CANCELLED = 'CANCELLED',   // ยกเลิก
  CONVERTED = 'CONVERTED',   // แปลงเป็น PO แล้ว
}
