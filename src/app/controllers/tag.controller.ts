import { Request, Response, NextFunction } from "express";
import { Document } from "mongoose";
import { TagModel, Tag } from "../models/index";
import { handleError } from "../shared/helper";

interface CustomRequest extends Request {
  user_id: any;
  tag?: TagModel;
}

// Define type aliases for request and response parameters
type TagId = string;
type Page = number;
type PageSize = number;
type SortOrder = 1 | -1;

// Define type aliases for query, sort, and options objects
type Query = { _userId?: string };
type Sort = { createdAt: SortOrder };
type Options = {
  totalCount: number;
  currentPage: Page;
  totalPages: number;
};

// Define an interface for the response object
interface TagResponse {
  data: (typeof Tag)[];
  options: Options;
}

// Define a helper function that takes the query parameters and options as arguments and returns the response object
const getResponseObject = async (
  query: Query,
  page: Page,
  pageSize: PageSize,
  sort: Sort
): Promise<TagResponse> => {
  // Calculate skip and limit values
  const skip: number = (page - 1) * pageSize;
  const limit: number = pageSize;

  // Get the total number of Tags that match the query
  const totalCount: number = await Tag.countDocuments(query);
  // Get the Tags as plain JavaScript objects
  // Use generics to specify the type of the document
  const data: (typeof Tag)[] = await Tag.find<TagModel>(query)
    .skip(skip)
    .limit(limit)
    .sort(sort);
  const options: Options = {
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / pageSize),
  };
  // Use interface to define the shape of the response object
  const response: TagResponse = {
    data,
    options,
  };
  return response;
};

/**
 * GET /Tags
 * Purpose: Get all Tags
 */
const getAllTags = async (req: CustomRequest, res: Response) => {
  // We want to return an array of all the Tags that belong to the authenticated user
  try {
    // Define the query parameters and options
    const query: Query = { _userId: req.user_id }; // Your condition
    const page: Page = parseInt(req.query.page as string) || 1; // Current page number
    const pageSize: PageSize = parseInt(req.query.pageSize as string) || 10; // Number of documents per page
    const sort: Sort = {
      createdAt: req.query.sort === "ASC" ? 1 : -1,
    }; // sorting by createdAt

    // Call the helper function with the query parameters and options
    const response = await getResponseObject(query, page, pageSize, sort);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).send(error);
  }
};

/* ROUTE HANDLERS */
/* Tag ROUTES */

// Middleware function to find a Tag by id and user id
const findTagById = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tagId: TagId = req.params.id;
    const userId = req.user_id;
    // Use generics to specify the type of the document
    const tag: TagModel | null = await Tag.findOne<TagModel>({
      _id: tagId,
      _userId: userId,
    });
    if (!tag) {
      return res.status(404).send({ message: "Tag not found" });
    }
    // Attach the tag to the request object for later use
    req.tag = tag;
    next();
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * GET /:id
 * Purpose: Get a tag by id
 */
// Use async/await syntax to simplify the code
const getTag = async (req: CustomRequest, res: Response) => {
  try {
    const tagId: TagId = req.params.id;
    const userId = req.user_id;
    // Use generics to specify the type of the document
    const tag: TagModel | null = await Tag.findOne<TagModel>({
      _id: tagId,
      _userId: userId,
    });
    if (!tag) {
      return res.status(404).send({ message: "Tag not found" });
    } else {
      res.status(200).json(tag);
    }
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * POST /create
 * Purpose: Create a tag
 */
const createTag = async (req: CustomRequest, res: Response) => {
  // We want to create a new Tag and return the new Tag document back to the user (which includes the id)
  // The Tag information (fields) will be passed in via the JSON request body
  try {
    const {
      title,
      url,
      description,
    }: {
      title: string;
      url: string;
      description: string;
      image: string;
    } = req.body;
    const userId = req.user_id;

    const newTag: Document = new Tag({
      title,
      url,
      description,
      _userId: userId,
    });
    const tagDoc: Document = await newTag.save();
    // The full tag document is returned (incl. id)
    res.status(201).json(tagDoc);
  } catch (error: any) {
    handleError(res, error);
  }
};

/**
 * PATCH /update/:id
 * Purpose: Update a specified tag
 */
const updateTag = async (req: CustomRequest, res: Response) => {
  // We want to update the specified Tag (Tag document with id in the URL) with the new values specified in the JSON body of the request
  try {
    const newTagData: {
      title?: string;
      url?: string;
      description?: string;
      tags?: any;
      image?: string;
    } = req.body;
    // The Tag to update is already attached to the request object by the middleware function
    const tag: any = req.tag;
    // Update the Tag with the new data using Object.assign()
    Object.assign(tag, newTagData);
    // Save the updated Tag and return a success message
    await tag.save();
    res.json({ message: "Updated successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * DELETE /delete/:id
 * Purpose: Delete a Tag
 */
const deleteTag = async (req: CustomRequest, res: Response) => {
  // We want to delete the specified Tag (document with id in the URL)
  try {
    // The Tag to delete is already attached to the request object by the middleware function
    const tag: any = req.tag;
    // Remove the tag and return the removed document
    const removedTagDoc = await Tag.findOneAndRemove(Tag);
    if (removedTagDoc) {
      res
        .status(200)
        .json({ message: `${removedTagDoc.title} deleted successfully` });
    } else {
      res.status(404).send({ status: 404, message: "Tag not found" });
    }
  } catch (error) {
    handleError(res, error);
  }
};

export { getAllTags, createTag, updateTag, deleteTag, findTagById, getTag };
