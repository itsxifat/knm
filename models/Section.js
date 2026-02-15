import mongoose from 'mongoose';

const SectionSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Internal admin name
  type: { type: String, enum: ['image', 'video'], default: 'image' },
  order: { type: Number, default: 0 }, // For sorting position
  isActive: { type: Boolean, default: true },
  
  // Content
  heading: { type: String },
  subHeading: { type: String },
  mediaUrl: { type: String, required: true }, // Image URL or Video Path (e.g., /uploads/vid.mp4)
  link: { type: String }, // Where the banner clicks to
  
  // Relations
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

export default mongoose.models.Section || mongoose.model('Section', SectionSchema);