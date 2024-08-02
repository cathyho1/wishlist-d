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

const config = {
  storeUrl: 'https://admin.shopify.com/store/coes-functions'
};

export const loader = async ({ request }) => {
  const auth = await authenticate.admin(request);
  const shop = auth.session.shop;
  const accessToken = auth.session.accessToken;
  console.log('Shop:', shop);
  console.log('Access Token:', accessToken);

  const wishlistData = await db.wishlist.findMany({
    where: {
      shop: shop,
    },
    orderBy: [
      { customerId: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  // Filter to get the most recent record for each customerId
  const latestWishlistData = wishlistData.reduce((acc, current) => {
    const existing = acc.find(item => item.customerId === current.customerId);
    if (!existing) {
      acc.push(current);
    }
    return acc;
  }, []);

  console.log('Wishlist Data:', latestWishlistData);

  const fetchCustomerDataGraphQL = async (customerId) => {
    try {
      console.log(`Fetching data for customer ID: ${customerId}`);
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

      console.log(`Response status for customer ID ${customerId}: `, response.status, response.statusText);
      console.log(`Response headers for customer ID ${customerId}: `, JSON.stringify([...response.headers], null, 2));

      const responseBody = await response.text();
      console.log(`Raw response body for customer ID ${customerId}: `, responseBody);

      if (!response.ok) {
        throw new Error(`Error fetching customer data: ${response.status} ${response.statusText}`);
      }

      const { data, errors } = JSON.parse(responseBody);

      if (errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(errors, null, 2)}`);
      }

      console.log(`Parsed customer data for customer ID ${customerId}: `, JSON.stringify(data, null, 2));

      return data.customer;
    } catch (error) {
      console.error(`Error fetching customer data for customer ID ${customerId}:`, error);
      return null;
    }
  };

  const customerDetails = await Promise.all(
    latestWishlistData.map(async (item) => {
      const customer = await fetchCustomerDataGraphQL(item.customerId);
      const wishlistItemCount = wishlistData.filter(w => w.customerId === item.customerId).length;
      return {
        ...item,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
        customerEmail: customer ? customer.email : 'Unknown',
        wishlistItemCount,
      };
    })
  );

  console.log('Customer Details:', customerDetails);

  return json(customerDetails);
};

export const action = async ({ request }) => {
  // Handle any actions here if needed
};

export default function Index() {
  const wishlistData = useLoaderData();
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const linkThroughStyle = {
    textDecoration: 'none',
  };

  const linkThroughHoverStyle = {
    textDecoration: 'underline',
  };

  const wishlistArray = wishlistData.map((item) => {
    const createdAt = formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true });
    return [item.customerId, item.customerName, item.customerEmail, createdAt, item.wishlistItemCount];
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

  return (
    <Page title="Customers">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <Text as="h2" variant="headingMd">
                Customers with a Wishlist.
                <br />
                <br />
              </Text>
              <TextField
                label="Search"
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                placeholder="Search by customer name or email"
              />
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              {wishlistData.length > 0 ? (
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
                    'Created At',
                    'Products',
                  ]}
                  rows={filteredWishlistArray.map(row => [
                    row[0],
                    <a href={`${config.storeUrl}/apps/coes-wishlist-app/app/customer-wishlist?customerId=${row[0]}`} target="_blank" style={linkThroughStyle} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'} rel="noopener noreferrer">{row[1]}</a>,
                    <a href={`${config.storeUrl}/apps/coes-wishlist-app/app/customer-wishlist?customerId=${row[0]}`} target="_blank" style={linkThroughStyle} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'} rel="noopener noreferrer">{row[2]}</a>,
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
                    url: 'https://youtube.com/codeinspire',
                    external: "true",
                  }}
                  secondaryAction={{
                    content: 'Watch videos',
                    url: 'https://youtube.com/codeinspire',
                    external: "true",
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>No customers are using the Wishlist.</p>
                </EmptyState>
              )}
            </Card>
          </Layout.Section>
          <Layout.Section>
            <BlockStack gap="500">
              <Card sectioned>
                <Text as="h2" variant="headingMd">
                  Store URL
                </Text>
                <Link url={config.storeUrl} external>
                  {config.storeUrl}
                </Link>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
