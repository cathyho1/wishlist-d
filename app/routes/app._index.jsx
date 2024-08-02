import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  List,
  Link,
  InlineStack,
  EmptyState,
  DataTable,
  TextField,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useLoaderData } from "@remix-run/react";
import { formatDistanceToNow, parseISO } from 'date-fns';

export const loader = async ({ request }) => {
  try {
    const auth = await authenticate.admin(request);
    const shop = auth.session.shop;
    const accessToken = auth.session.accessToken;

    const wishlistData = await db.wishlist.findMany({
      where: {
        shop: shop,
      },
      orderBy: [
        { customerId: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const totalRowCount = await db.wishlist.count({
      where: {
        shop: shop,
      },
    });

    // Filter to get the most recent record for each customerId
    const latestWishlistData = wishlistData.reduce((acc, current) => {
      const existing = acc.find(item => item.customerId === current.customerId);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);

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

    const customerDetails = await Promise.all(
      latestWishlistData.map(async (item) => {
        const customer = await fetchCustomerDataGraphQL(item.customerId);
        return {
          ...item,
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
          customerEmail: customer ? customer.email : 'Unknown',
        };
      })
    );

    return json({ customerDetails, totalRowCount, shop });
  } catch (error) {
    console.error('Error in loader function:', error);
    return json({ customerDetails: [], totalRowCount: 0, shop: '' });
  }
};

export const action = async ({ request }) => {
  // Handle any actions here if needed
};

export default function Index() {
  const loaderData = useLoaderData();
  const { customerDetails = [], totalRowCount = 0, shop = '' } = loaderData || {};
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const wishlistArray = customerDetails.map((item) => {
    const createdAt = formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true });
    return [item.customerId, item.customerName, item.customerEmail, item.productId, createdAt];
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

  const filteredWishlistArray = sortedWishlistArray.filter(
    (item) =>
      item[1].toLowerCase().includes(searchTerm.toLowerCase()) || 
      item[2].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (columnIndex) => {
    let newDirection = 'asc';
    if (sortColumn === columnIndex && sortDirection === 'asc') {
      newDirection = 'desc';
    }
    setSortColumn(columnIndex);
    setSortDirection(newDirection);
  };

  const uniqueCustomerEmails = new Set(customerDetails.map(item => item.customerEmail));
  const uniqueEmailCount = uniqueCustomerEmails.size;

  return (
    <Page title="Wishlist overview dashboard">
      <ui-title-bar title="Overview">
      </ui-title-bar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <TextField
                label="Search"
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                placeholder="Search by customer name or email"
              />
            </Card>
          </Layout.Section>
        <Layout.Section>
            <Card sectioned>
              <Text variant="headingMd">Customers: {uniqueEmailCount}</Text>
              <Text variant="headingMd">Wishlisted Items: {totalRowCount}</Text>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              {customerDetails.length > 0 ? (
                <DataTable
                  columnContentTypes={[
                    'text',
                    'text',
                    'text',
                    'text',
                    'text',
                  ]}
                  headings={[
                    'Customer ID',
                    'Customer Name',
                    'Customer Email',
                    'Product ID',
                    'Created At',
                  ]}
                  rows={filteredWishlistArray.map(row => [
                    row[0],
                    row[1],
                    row[2],
                    row[3],
                    row[4],
                  ])}
                  sortable={[true, true, true, true, true]}
                  onSort={handleSort}
                  sortDirection={sortDirection}
                  initialSortColumnIndex={sortColumn}
                />
              ) : (
                <EmptyState
                  heading="Manage your wishlist products here"
                  action={{
                    content: 'Learn more',
                    url: `https://youtube.com/codeinspire`,
                    external: "true",
                  }}
                  secondaryAction={{
                    content: 'Watch videos',
                    url: 'https://youtube.com/codeinspire',
                    external: "true",
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>You don't have any products in your wishlist yet.</p>
                </EmptyState>
              )}
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card sectioned>
              <Text variant="headingMd">Store: {shop}</Text>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
