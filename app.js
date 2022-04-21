import express from "express";
import mysql from "promise-mysql";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || process.env.SERVER_LOCAL_PORT;
const { HOST_DB, DATABASE_NAME, USERNAME_DB, PASSWORD_DB } = process.env;

// Paramétrage du moteur de rendu et du dossier views
app.set("views", "./views");
app.set("view engine", "ejs");

// Utiliser le fichier statique, ici pour les styles
app.use(express.static("public"));

// Connexion à la base de données
mysql
  .createConnection({
    host: HOST_DB,
    database: DATABASE_NAME,
    user: USERNAME_DB,
    password: PASSWORD_DB,
  })
  .then((db) => {
    app.get("/", async (request, response) => {
      const orders = await db.query("SELECT * FROM orders");
      response.render("template", { template: "home", data: orders });
    });

    app.get("/details/:id", async (request, response) => {
      const id = request.params.id;
      const customersQuery =
        "SELECT * FROM customers INNER JOIN orders ON orders.customerNumber = customers.customerNumber WHERE orders.orderNumber = ?";
      const orderDetailsQuery =
        "SELECT * FROM orderdetails INNER JOIN orders ON orders.orderNumber = orderdetails.orderNumber INNER JOIN products ON products.productCode = orderdetails.productCode WHERE orders.orderNumber = ?";
      const totalValueQuery =
        "SELECT  SUM(quantityOrdered * priceEach) as totalValue FROM orderDetails INNER JOIN orders ON orders.orderNumber = orderdetails.orderNumber GROUP BY orders.orderNumber HAVING orders.orderNumber = ?";

      const customer = await db.query(customersQuery, [id]);
      const orderDetails = await db.query(orderDetailsQuery, [id]);
      const totalValue = await db.query(totalValueQuery, [id]);

      const tva = (totalValue[0].totalValue * 20) / 100;
      const ttc = tva + totalValue[0].totalValue;

      response.render("template", {
        template: "details",
        customer: customer[0],
        orderDetails: orderDetails,
        totalValue: totalValue[0].totalValue.toFixed(2),
        tva: tva.toFixed(2),
        ttc: ttc.toFixed(2),
      });
    });
  });

// ECOUTE
app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`);
});
