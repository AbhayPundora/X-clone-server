import type { Tweet } from "../../../generated/prisma/index.js";
import { prismaClient } from "../../clients/db/index.js";
import type { GraphqlContext } from "../../interfaces.js";

export interface createTweetPayload {
  content: string;
  imageURL?: string;
}

const queries = {
  getAllTweets: async () =>
    prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } }),
};

const mutations = {
  createTweet: async (
    parent: any,
    { payload }: { payload: createTweetPayload },
    ctx: GraphqlContext,
  ) => {
    if (!ctx.user) throw new Error("You are not authenticated");
    const tweet = await prismaClient.tweet.create({
      data: {
        content: payload.content,
        imageURL: payload.imageURL ?? null,
        author: { connect: { id: ctx.user.id } },
      },
    });

    return tweet;
  },
};

// for retrieving extra details like about "author" in Tweet type, bcz graphql doesn't know how to reference "author" property in Tweet type, cz it is done by database
// for "author" property "Tweet" is its parent
//now we are finding the author in user table by using authorId in Tweet table
const extraResolvers = {
  Tweet: {
    author: (parent: Tweet) =>
      prismaClient.user.findUnique({ where: { id: parent.authorId } }),
  },
};

export const resolvers = { queries, mutations, extraResolvers };
