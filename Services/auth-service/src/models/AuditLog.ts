
import mongoose, { Schema, Document } from "mongoose";

interface IAuditLog extends Document {
  actor_id: string;
  actor_type: string;
  company_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address?: string;
  user_agent?: string;
  changes?: {
    before: any;
    after: any;
  };
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  actor_id: { type: String, required: true, index: true },
  actor_type: {
    type: String,
    required: true,
    enum: ["fleet_operator", "company_user", "system"],
  },
  company_id: { type: String, index: true },
  action: { type: String, required: true },
  resource_type: { type: String, required: true },
  resource_id: { type: String, required: true },
  ip_address: String,
  user_agent: String,
  changes: {
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
  },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
});

// Indexes
AuditLogSchema.index({ company_id: 1, timestamp: -1 });
AuditLogSchema.index({ actor_id: 1, timestamp: -1 });
AuditLogSchema.index({ resource_type: 1, resource_id: 1 });
// TTL index - auto delete after 1 year
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
