// Import the required modules from mongoose
import { Document, Schema, Model, model, Types } from "mongoose";

// Define an interface for the bookmark document
interface BookmarkDocument extends Document {
  title: string;
  url: string;
  tags?: string[];
  description?: string;
  icon?: string;
  _userId: any;
}

// Define an interface for the bookmark model
interface BookmarkModel extends Model<BookmarkDocument> {
  // You can define any static methods here
  findByUser(userId: Types.ObjectId): Promise<BookmarkDocument[]>;
}

// Define the schema for the bookmark document
const bookmarkSchema = new Schema<BookmarkDocument>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    tags: { type: [String] },
    description: { type: String },
    icon: { type: String },
    _userId: { type: Types.ObjectId, required: true },
  },
  { timestamps: true }
);

// Create an index on the title, url fields
bookmarkSchema.index({ title: 1, url: 1 });

// Add a pre-validation hook to check the url format
bookmarkSchema.pre("validate", function (next) {
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  if (!urlRegex.test(this.url)) {
    next(new Error("Invalid URL format"));
  } else {
    next();
  }
});

// Add a static method to find bookmarks by user id
bookmarkSchema.statics.findByUser = async function (userId) {
  try {
    return await this.find({ _userId: userId });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Create the model for the bookmark document using generics
const Bookmark = model<BookmarkDocument, BookmarkModel>(
  "Bookmark",
  bookmarkSchema,
  "bookmarks"
);

// Export the model and the interface
export { Bookmark, BookmarkModel };
