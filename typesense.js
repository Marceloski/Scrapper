/*
 *  Our JavaScript client library works on both the server and the browser.
 *  When using the library on the browser, please be sure to use the
 *  search-only API Key rather than the master API key since the latter
 *  has write access to Typesense and you don't want to expose that.
 */
import Typesense from "typesense";
import functions from "firebase-functions/v1";

export const client = new Typesense.Client({
  nodes: [
    {
      host: "localhost", // For Typesense Cloud use xxx.a1.typesense.net
      port: 8108, // For Typesense Cloud use 443
      protocol: "http", // For Typesense Cloud use https
    },
  ],
  apiKey: "xyz",
  connectionTimeoutSeconds: 2,
});

const productsCollection = {
  name: "products",
  fields: [
    { name: "id", type: "string" },
    { name: "description", type: "string" },
    { name: "manufacturer", type: "string" },
    { name: "manufacturerPartNo", type: "string" },
    { name: "productCategory", type: "string" },
  ],
};

//client.collections().create(productsCollection);

export const onProductCreate = functions.firestore
  .document("products/{productID}")
  .onCreate((snapshot, context) => {
    console.log("se ejecuta onProductCreate");
    // Grab the document id as id value.
    const data = snapshot.data();
    //snapshot.id
    let document = {
      description: data.description,
      manufacturer: data.manufacturer,
      manufacturerPartNo: data.manufacturerPartNo,
      productCategory: data.productCategory,
    };

    // Index the document in books collection
    return client.collections("products").documents().create(document);
  });

export const onProductUpdate = functions.firestore
  .document("products/{productID}}")
  .onUpdate((change, context) => {
    console.log("se ejecuta onProductUpdate");
    // Grab the changed value
    // let id = context.params.bookID;
    // const { description, manufacturer, manufacturerPartNo, productCategory } =
    //   change.after.data();
    // let document = {
    //   id,
    //   description,
    //   manufacturer,
    //   manufacturerPartNo,
    //   productCategory,
    // };
    // return client.collections("products").documents(id).update(document);
  });
