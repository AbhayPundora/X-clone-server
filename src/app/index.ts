import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import bodyParser from "body-parser";
import { User } from "./user/index.js";
import type { GraphqlContext } from "../interfaces.js";
import JWTService from "../services/jwt.js";

export async function initServer() {
  const app = express();
  app.use(cors());

  app.use(bodyParser.json());

  const graphqlServer = new ApolloServer<GraphqlContext>({
    //typedefs is like schema to tell graphql what query and mutation are we using.
    typeDefs: `
    ${User.types}
        type Query {
          ${User.queries}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
      },
    },
  });

  await graphqlServer.start();

  app.use(
    "/graphql",
    expressMiddleware(graphqlServer, {
      context: async ({ req, res }) => {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ")
          ? authHeader.split("Bearer ")[1]
          : undefined;

        return {
          user: token ? JWTService.decodeToken(token) : undefined,
        };
      },
    }),
  );

  return app;
}
