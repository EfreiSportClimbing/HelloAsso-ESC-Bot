// Creating a Cron Job that executes every hours
const url = require("url");
const axios = require("axios");
var cron = require("node-cron");
require("dotenv").config();

const {
  HELLO_ASSO_CLIENT_ID,
  HELLO_ASSO_CLIENT_SECRET,
  ORGANIZATION_SLUG,
  CLIMBUP_FORM_SLUG,
} = process.env;

let accessToken = null;
let refreshToken = null;
let refreshInterval = null;

async function getAccessToken() {
  if (accessToken) {
    return await refreshAccessToken();
  }
  const body = new url.URLSearchParams();
  body.append("client_id", HELLO_ASSO_CLIENT_ID);
  body.append("client_secret", HELLO_ASSO_CLIENT_SECRET);
  body.append("grant_type", "client_credentials");
  return await axios
    .post(`https://api.helloasso.com/oauth2/token`, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .then((response) => {
      accessToken = response.data.access_token;
      refreshToken = response.data.refresh_token;
      refreshInterval = response.data.expires_in;
      return accessToken;
    })
    .catch((error) => {
      throw error;
    });
}

async function refreshAccessToken() {
  const body = new url.URLSearchParams();
  body.append("client_id", HELLO_ASSO_CLIENT_ID);
  body.append("grant_type", "refresh_token");
  body.append("refresh_token", refreshToken);

  return await axios
    .post(`https://api.helloasso.com/oauth2/token`, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .then((response) => {
      accessToken = response.data.access_token;
      refreshToken = response.data.refresh_token;
      refreshInterval = response.data.expires_in;
      return accessToken;
    })
    .catch((error) => {
      throw error;
    });
}

var task = cron.schedule("* * * * *", async () => {
  console.log("task running")
  const token = await getAccessToken();
  const response = await axios
    .get(
      `
      https://api.helloasso.com/v5/organizations/${ORGANIZATION_SLUG}/forms/Event/${CLIMBUP_FORM_SLUG}/orders
    `,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    .then((result) => result.data)
    .catch((error) => {
      throw error;
    });
  console.log(response);
});

task.start();

