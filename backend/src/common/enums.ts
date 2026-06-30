export enum UserRole {
  VISITOR = 'visitor',
  HOST = 'host',
  GATE_SECURITY = 'gate_security',
  SECURITY_SUPERVISOR = 'security_supervisor',
  ADMIN = 'admin',
  COMPLIANCE = 'compliance',
  EVENT_COORDINATOR = 'event_coordinator',
}

export enum VisitStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum VisitorCategory {
  INDIVIDUAL = 'individual',
  BULK_EVENT = 'bulk_event',
  VENDOR = 'vendor',
  RECURRING = 'recurring',
  VIP = 'vip',
  WALK_IN = 'walk_in',
}

export enum BadgeType {
  STANDARD = 'standard',
  ESCORTED = 'escorted',
  VENDOR = 'vendor',
  VIP = 'vip',
  EVENT = 'event',
}

export enum CheckInMode {
  STANDARD = 'standard',
  FAST_LANE = 'fast_lane',
  OFFLINE = 'offline',
}

export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  APPROVE = 'approve',
  REJECT = 'reject',
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  BLACKLIST = 'blacklist',
  LOGIN = 'login',
  SYNC = 'sync',
  BULK_UPLOAD = 'bulk_upload',
  DELETE = 'delete',
}
