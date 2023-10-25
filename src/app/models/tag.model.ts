// Import the required modules from mongoose
import { Document, Schema, Model, model, Types } from "mongoose";

// Define an interface for the tag document
interface TagDocument extends Document {
  title: string;
  _userId: any;
}

// Define an interface for the tag model
interface TagModel extends Model<TagDocument> {
  // You can define any static methods here
  findByUser(userId: Types.ObjectId): Promise<TagDocument[]>;
}

// Define the schema for the tag document
const tagSchema = new Schema<TagDocument>(
  {
    title: { type: String, required: true },
    _userId: { type: Types.ObjectId, required: true },
  },
  { timestamps: true }
);

// Create an index on the title field
tagSchema.index({ title: 1 });

// Add a static method to find tags by user id
tagSchema.statics.findByUser = async function (userId) {
  try {
    return await this.find({ _userId: userId });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Create the model for the tag document using generics
const Tag = model<TagDocument, TagModel>("Tag", tagSchema, "Tags");

// Export the model and the interface
export { Tag, TagModel };
