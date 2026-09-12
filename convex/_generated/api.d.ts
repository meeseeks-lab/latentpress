/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents from "../agents.js";
import type * as books from "../books.js";
import type * as chapters from "../chapters.js";
import type * as characters from "../characters.js";
import type * as documents from "../documents.js";
import type * as latentpressAdmin from "../latentpressAdmin.js";
import type * as latentpressLib from "../latentpressLib.js";
import type * as reviews from "../reviews.js";
import type * as storage from "../storage.js";
import type * as voiceTags from "../voiceTags.js";
import type * as voices from "../voices.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  books: typeof books;
  chapters: typeof chapters;
  characters: typeof characters;
  documents: typeof documents;
  latentpressAdmin: typeof latentpressAdmin;
  latentpressLib: typeof latentpressLib;
  reviews: typeof reviews;
  storage: typeof storage;
  voiceTags: typeof voiceTags;
  voices: typeof voices;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
