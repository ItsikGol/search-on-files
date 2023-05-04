import path from "path";
import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { fileURLToPath } from "url";
const port = process.env.PORT || 5000;
import fetch from "node-fetch";
import fs from "fs";
import base64 from "base64-js";
import mammoth from "mammoth";
import { JSDOM } from "jsdom";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.resolve(__dirname, "public")));
app.use("/public-search",express.static(path.resolve(__dirname, "public-search")));
app.get("/healthcheck", (req, res) => res.json({ message: "Ok" }));

// const username =  process.env.USERNAME
// const endpoint =process.env.OPENSEARCHURL
const username = "admin";
const password = process.env.PASSWORD;
const index = "takam-document";
const baseEndpoint = `https://search-mof-open-search-domain-2wx4on2tpxcq5w4agdk2cyydxu.eu-west-1.es.amazonaws.com/${index}`;

app.get("/api/find-text", async (req, res) => {
  try {
    const endpoint = `${baseEndpoint}/_search`;
    const requestBody = buildRequestToFindIndex(req.query.text);
    const requestInfo = buildRequestInfo(requestBody);

    const response = await fetch(endpoint, requestInfo);
    const data = await response.json();
    //console.log(data);
    // console.log(data.hits.hits[0])
    res.status(200).json(data.hits.hits);
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.get("/api/create-index", async (req, res) => {

  const endpoint = `${baseEndpoint}/_doc`
  //const response_data = process.env.BASE64OfWORD //form sf - only exmple
  //const binary_data = base64.toByteArray(response_data)
  //fs.writeFileSync(nameDoc, binary_data)
  const nameDoc = req?.query?.nameFile || 'document.docx'

  const result = await mammoth.convertToHtml({ path: nameDoc })
  const html = result.value;
  const dom = new JSDOM(html);
  const text = dom.window.document.querySelector("body").textContent;
  const dateNow = new Date();
  const data = {
    data: [
      {
        id: nameDoc,
        textDoc: text,
        numberPages: 1,
        createDoc: `${dateNow.getDay()}_${dateNow.getMonth()}_${dateNow.getFullYear()}_${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`,
      },
    ],
  };
  //console.log(data.data[0]);

  const json = JSON.stringify(data.data[0]);
  await fs.promises.writeFile("data.json", json, "utf8");
  console.log("Data saved to file");

  const resultCreateIndex = await createIndex(endpoint, data.data[0]);
  res.status(200).json(resultCreateIndex);
});



const buildRequestToFindIndex = (text) => {
  const requestBody = {
    sort: {
      numberPages: {
        order: "asc",
      },
    },
    // from: 1,
    // size: 1,
    query: {
      query_string: {
        query: `*${text}*`,
        fields: ["textDoc"],
      },
    },
    highlight: {
      pre_tags: ["<strong>"],
      post_tags: ["</strong>"],
      fields: {
        textDoc: {
          fragment_size: 50,
          number_of_fragments: 1,
        },
      },
    },
  };

  return requestBody;
}

const buildRequestInfo = (requestBody) => {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
    },
    body: JSON.stringify(requestBody),
  }
}

const createIndex = async (endpoint, requestBody) => {
  try {
    const requestInfo = buildRequestInfo(requestBody);
    const response = await fetch(endpoint, requestInfo);
    const data = await response.json();
    //console.log(data);
    return data;
  } catch (error) {
    console.log(error);
    return error;
  }
}

app.listen(port, () =>
  console.log(`Server started on port http://localhost:${port}`)
);