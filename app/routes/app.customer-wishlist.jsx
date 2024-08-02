import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  EmptyState,
  DataTable,
  TextField,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { formatDistanceToNow, parseISO } from 'date-fns';

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const customerId = url.searchParams.get('customerId');

  const auth = await authenticate.admin(request);
  const shop = auth.session.shop;
  const accessToken = auth.session.accessToken;

  let wishlistData;
  if (customerId) {
    wishlistData = await db.wishlist.findMany({
      where: {
        shop: shop,
        customerId: customerId,
      },
      orderBy: {
        id: "asc",
      },
    });
  } else {
    wishlistData = await db.wishlist.findMany({
      where: {
        shop: shop,
      },
      orderBy: {
        id: "asc",
      },
    });
  }

  const fetchCustomerDataGraphQL = async (customerId) => {
    try {
      const query = `
        {
          customer(id: "gid://shopify/Customer/${customerId}") {
            firstName
            lastName
            email
          }
        }
      `;

      const response = await fetch(
        `https://${shop}/admin/api/2022-04/graphql.json`,
        {
          method: 'POST',
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching customer data: ${response.status} ${response.statusText}`);
      }

      const { data, errors } = await response.json();

      if (errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(errors, null, 2)}`);
      }

      return data.customer;
    } catch (error) {
      console.error(`Error fetching customer data for customer ID ${customerId}:`, error);
      return null;
    }
  };

  const fetchProductDataGraphQL = async (productId) => {
    try {
      const query = `
        {
          product(id: "gid://shopify/Product/${productId}") {
            title
          }
        }
      `;

      const response = await fetch(
        `https://${shop}/admin/api/2022-04/graphql.json`,
        {
          method: 'POST',
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching product data: ${response.status} ${response.statusText}`);
      }

      const { data, errors } = await response.json();

      if (errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(errors, null, 2)}`);
      }

      return data.product;
    } catch (error) {
      console.error(`Error fetching product data for product ID ${productId}:`, error);
      return null;
    }
  };

  const customer = customerId ? await fetchCustomerDataGraphQL(customerId) : null;

  const wishlistWithProductTitles = await Promise.all(
    wishlistData.map(async (item) => {
      const product = await fetchProductDataGraphQL(item.productId);
      const customer = customerId ? null : await fetchCustomerDataGraphQL(item.customerId);
      return {
        ...item,
        productTitle: product ? product.title : 'Unknown Product',
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : null,
        customerEmail: customer ? customer.email : null,
      };
    })
  );

  const totalWishlistItems = wishlistData.length;

  return json({ wishlistData: wishlistWithProductTitles, customer, shop, customerId, totalWishlistItems });
};

export const action = async ({ request }) => {
  // Handle any actions here if needed
};

export default function CustomerWishlist() {
  const { wishlistData, customer, shop, customerId, totalWishlistItems } = useLoaderData();
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const constructProductAdminUrl = (productId) => `https://${shop}/admin/products/${productId}`;
  const constructCustomerAdminUrl = (customerId) => `https://${shop}/admin/customers/${customerId}`;

  const handleCustomerClick = (customerId) => {
    searchParams.set('customerId', customerId);
    setSearchParams(searchParams);
  };

  const wishlistArray = wishlistData.map((item) => {
    const createdAt = formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true });
    return customer
      ? [
          item.productId.toString(), // Ensure it's a string
          item.productTitle.toString(), // Ensure it's a string
          createdAt.toString(), // Ensure it's a string
        ]
      : [
          item.customerId.toString(), // Ensure it's a string
          <Link onClick={() => handleCustomerClick(item.customerId)}>{item.customerName}</Link>,
          <Link onClick={() => handleCustomerClick(item.customerId)}>{item.customerEmail}</Link>,
          item.productId.toString(), // Ensure it's a string
          item.productTitle.toString(), // Ensure it's a string
          createdAt.toString(), // Ensure it's a string
        ];
  });

  const sortedWishlistArray = [...wishlistArray];

  if (sortColumn !== null) {
    sortedWishlistArray.sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];

      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  const filteredWishlistArray = sortedWishlistArray.filter((item) =>
    item.some((cell) =>
      typeof cell === 'string' && cell.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleSort = (columnIndex) => {
    let newDirection = 'asc';
    if (sortColumn === columnIndex && sortDirection === 'asc') {
      newDirection = 'desc';
    }
    setSortColumn(columnIndex);
    setSortDirection(newDirection);
  };

  return (
    <Page title="Customer Wishlist">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <BlockStack gap="500">
                {customer ? (
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingMd">
                      {`${customer.firstName} ${customer.lastName}`}
                      <br />
                      <br />
                      {`${customer.email}`}
                      <br />
                      <br />
                      {`Wishlisted Items: ${totalWishlistItems}`}
                    </Text>
                    <a href={constructCustomerAdminUrl(customerId)} target="_blank" rel="noopener noreferrer">View on Shopify</a>
                  </InlineStack>
                ) : (
                  <Text as="h2" variant="headingMd">
                    All Wishlisted Items
                  </Text>
                )}
                <TextField
                  label="Search"
                  value={searchTerm}
                  onChange={(value) => setSearchTerm(value)}
                  placeholder="Search"
                />
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              {wishlistData.length > 0 ? (
                <DataTable
                  columnContentTypes={
                    customer
                      ? ['text', 'text', 'text']
                      : ['text', 'text', 'text', 'text', 'text', 'text']
                  }
                  headings={
                    customer
                      ? ['Product ID', 'Product Title', 'Created At']
                      : ['Customer ID', 'Customer Name', 'Customer Email', 'Product ID', 'Product Title', 'Created At']
                  }
                  rows={filteredWishlistArray}
                  sortable={customer ? [true, true, true] : [true, true, true, true, true, true]}
                  onSort={handleSort}
                  sortDirection={sortDirection}
                  initialSortColumnIndex={sortColumn}
                />
              ) : (
                <EmptyState
                  heading="No wishlist products found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>No products found in the wishlist.</p>
                </EmptyState>
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
