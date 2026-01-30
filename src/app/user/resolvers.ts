import axios from "axios";
import { prismaClient } from "../../clients/db/index.js";
import JWTService from "../../services/jwt.js";

interface GoogleTokenResult {
  iss?: string;
  azp?: string;
  aud?: string;
  sub?: string;
  email: string;
  email_verified: string;
  nbf?: string;
  name?: string;
  picture?: string;
  given_name: string;
  family_name?: string;
  iat?: string;
  exp?: string;
  jti?: string;
  alg?: string;
  kid?: string;
  typ?: string;
}

/* data flow

-- login from google in frontend ->
-- it will give us an object with a "credential" property in it ->
-- "credential" is a token that contain user google account related detail, from which he is signing ->
-- now we will send this token to our "verifyGoogleToken" query ->
-- in which we will make an axios call to a google endpoint and receive all that "user google account related detail" as "data"(object) in our server ->
-- now we will find that user in our db with the "email" property in data object ->
-- if user not exist then we will create a new user ->
-- and at the end we will create a "jwt token" for that user and return it ->
-- now our query is completed ⭐

*/

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const googleToken = token;
    const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleOauthURL.searchParams.set("id_token", googleToken);

    const { data } = await axios.get<GoogleTokenResult>(
      googleOauthURL.toString(),
      {
        responseType: "json",
      },
    );

    // console.log(data);

    const user = await prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      await prismaClient.user.create({
        data: {
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name ?? null,
          profileImageURL: data.picture ?? null,
        },
      });
    }

    const userInDb = await prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (!userInDb) throw new Error("User with email not found");

    const userToken = await JWTService.generateTokenForUser(userInDb);

    return userToken;
  },
};

export const resolvers = { queries };
