// routes/api.wishlistByCustomer.jsx

import { json } from "@remix-run/node";
import db from "../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customerId");

  if (!customerId) {
    return cors(request, json({
      message: "Missing customerId",
      method: "GET"
    }), {
      origin: "*", // Adjust this as needed
      methods: ["GET"],
    });
  }

  const wishlist = await db.wishlist.findMany({
    where: {
      customerId: customerId,
    },
  });

  if (wishlist.length === 0) {
    return cors(request, json({
      message: "No wishlist data found for this customer.",
      method: "GET"
    }), {
      origin: "*", // Adjust this as needed
      methods: ["GET"],
    });
  }

  return cors(request, json({
    ok: true,
    message: "Success",
    data: wishlist,
  }), {
    origin: "*", // Adjust this as needed
    methods: ["GET"],
  });
}