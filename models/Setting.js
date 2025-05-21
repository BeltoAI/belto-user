import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  allowCopyPaste: {
    type: Boolean,
    default: true
  },
  copyPasteLectureOverride: {
    type: Boolean,
    default: false
  },
  notifications: {
    email: {
      type: Boolean,
      default: false
    },
    flaggedContent: {
      type: Boolean,
      default: false
    },
    weeklySummaries: {
      type: Boolean,
      default: false
    },
    aiUsageLimits: {
      type: Boolean,
      default: false
    },
    contentEdits: {
      type: Boolean,
      default: false
    }
  },
  exportFilters: {
    dateRange: {
      type: String,
      default: 'all'
    },
    course: {
      type: String,
      default: ''
    }
  }
}, { timestamps: true });

// Check if model exists before creating it (for Next.js hot reloading)
const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);

export default Setting;