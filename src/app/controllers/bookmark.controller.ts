import { Request, Response, NextFunction } from "express";
import { Document } from "mongoose";
import { BookmarkModel, Bookmark } from "../models/index";
import { handleError } from "../shared/helper";

interface CustomRequest extends Request {
  user_id: any;
  bookmark?: BookmarkModel;
}

// Define type aliases for request and response parameters
type BookmarkId = string;
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
interface BookmarkResponse {
  data: (typeof Bookmark)[];
  options: Options;
}

// Define a helper function that takes the query parameters and options as arguments and returns the response object
const getResponseObject = async (
  query: Query,
  page: Page,
  pageSize: PageSize,
  sort: Sort
): Promise<BookmarkResponse> => {
  // Calculate skip and limit values
  const skip: number = (page - 1) * pageSize;
  const limit: number = pageSize;

  // Get the total number of bookmarks that match the query
  const totalCount: number = await Bookmark.countDocuments(query);
  // Get the bookmarks as plain JavaScript objects
  // Use generics to specify the type of the document
  const data: (typeof Bookmark)[] = await Bookmark.find<BookmarkModel>(query)
    .skip(skip)
    .limit(limit)
    .sort(sort);
  const options: Options = {
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / pageSize),
  };
  // Use interface to define the shape of the response object
  const response: BookmarkResponse = {
    data,
    options,
  };
  return response;
};

/**
 * GET /bookmarks
 * Purpose: Get all bookmarks
 */
const getAllBookmarks = async (req: CustomRequest, res: Response) => {
  // We want to return an array of all the bookmarks that belong to the authenticated user
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
/* BOOKMARK ROUTES */

// Middleware function to find a bookmark by id and user id
const findBookmarkById = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookmarkId: BookmarkId = req.params.id;
    const userId = req.user_id;
    // Use generics to specify the type of the document
    const bookmark: BookmarkModel | null =
      await Bookmark.findOne<BookmarkModel>({
        _id: bookmarkId,
        _userId: userId,
      });
    if (!bookmark) {
      return res.status(404).send({ message: "Bookmark not found" });
    }
    // Attach the bookmark to the request object for later use
    req.bookmark = bookmark;
    next();
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * GET /:id
 * Purpose: Get a bookmark by id
 */
// Use async/await syntax to simplify the code
const getBookmark = async (req: CustomRequest, res: Response) => {
  try {
    const bookmarkId: BookmarkId = req.params.id;
    const userId = req.user_id;
    // Use generics to specify the type of the document
    const bookmark: BookmarkModel | null =
      await Bookmark.findOne<BookmarkModel>({
        _id: bookmarkId,
        _userId: userId,
      });
    if (!bookmark) {
      return res.status(404).send({ message: "Bookmark not found" });
    } else {
      res.status(200).json(bookmark);
    }
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * POST /create
 * Purpose: Create a bookmark
 */
const createBookmark = async (req: CustomRequest, res: Response) => {
  // We want to create a new bookmark and return the new bookmark document back to the user (which includes the id)
  // The bookmark information (fields) will be passed in via the JSON request body
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

    const newBookmark: Document = new Bookmark({
      title,
      url,
      description,
      _userId: userId,
    });
    const bookmarkDoc: Document = await newBookmark.save();
    // The full bookmark document is returned (incl. id)
    res.status(201).json(bookmarkDoc);
  } catch (error: any) {
    handleError(res, error);
  }
};

/**
 * PATCH /update/:id
 * Purpose: Update a specified bookmark
 */
const updateBookmark = async (req: CustomRequest, res: Response) => {
  // We want to update the specified bookmark (bookmark document with id in the URL) with the new values specified in the JSON body of the request
  try {
    const newBookmarkData: {
      title?: string;
      url?: string;
      description?: string;
      tags?: any;
      image?: string;
    } = req.body;
    // The bookmark to update is already attached to the request object by the middleware function
    const bookmark: any = req.bookmark;
    // Update the bookmark with the new data using Object.assign()
    Object.assign(bookmark, newBookmarkData);
    // Save the updated bookmark and return a success message
    await bookmark.save();
    res.json({ message: "Updated successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * DELETE /delete/:id
 * Purpose: Delete a bookmark
 */
const deleteBookmark = async (req: CustomRequest, res: Response) => {
  // We want to delete the specified bookmark (document with id in the URL)
  try {
    // The bookmark to delete is already attached to the request object by the middleware function
    const bookmark: any = req.bookmark;
    // Remove the bookmark and return the removed document
    const removedBookmarkDoc = await Bookmark.findOneAndRemove(bookmark);
    if (removedBookmarkDoc) {
      res
        .status(200)
        .json({ message: `${removedBookmarkDoc.title} deleted successfully` });
    } else {
      res.status(404).send({ status: 404, message: "Bookmark not found" });
    }
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * POST /insertMany
 * Purpose: insertMany bookmarks
 */
const insertManyBookmarks = async (req: CustomRequest, res: Response) => {
  // We want to insertMany bookmarks and return the new bookmarks document back to the user (which includes the id)
  // The bookmarks information (fields) will be passed in via the JSON request body
  try {
    const data: {
      title?: string;
      url?: string;
      tags?: string[];
      description: string;
      image?: string;
    }[] = req.body;
    const userId = req.user_id;

    console.log(data);
    const newData = data.map(function (obj) {
      return { ...obj, _userId: userId };
    });

    const bookmarksDocs: Document[] = await Bookmark.insertMany(newData);
    // The full bookmark document is returned (incl. id)
    res.status(201).json(bookmarksDocs);
  } catch (error) {
    handleError(res, error);
  }
};

export {
  getAllBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  findBookmarkById,
  getBookmark,
  insertManyBookmarks,
};
