export enum UserRole {
  ADMIN = 'ADMIN',
  PR_CREATOR = 'PR_CREATOR',        // พนักงานทั่วไป - สร้าง PR
  PR_APPROVER = 'PR_APPROVER',      // ผู้อนุมัติ PR
  PO_CREATOR = 'PO_CREATOR',        // พนักงานจัดซื้อ - สร้าง PO
  PO_APPROVER = 'PO_APPROVER',      // ผู้อนุมัติ PO
  WAREHOUSE_STAFF = 'WAREHOUSE_STAFF', // พนักงานคลัง - รับของ
}
