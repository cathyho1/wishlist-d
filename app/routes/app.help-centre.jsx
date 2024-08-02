import {
    Page,
    Layout,
    Text,
    Card,
    BlockStack,
    List,
    Link,
    InlineStack,
  } from "@shopify/polaris";
  
  export default function Index() {
    return (
      <Page title="Help Centre">
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <BlockStack gap="500">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      App template specs
                    </Text>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">
                          Course content
                        </Text>
                        <Link
                          url="https://youtube.com/codeinspire"
                          target="_blank"
                          removeUnderline
                        >
                          Codeinspire
                        </Link>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">
                          Source code
                        </Text>
                        <Link
                          url="https://github.com/Hujjat"
                          target="_blank"
                          removeUnderline
                        >
                          Github
                        </Link>
                      </InlineStack>
  
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">
                          Framework
                        </Text>
                        <Link
                          url="https://remix.run"
                          target="_blank"
                          removeUnderline
                        >
                          Remix
                        </Link>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">
                          Database
                        </Text>
                        <Link
                          url="https://www.prisma.io/"
                          target="_blank"
                          removeUnderline
                        >
                          Prisma
                        </Link>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">
                          Interface
                        </Text>
                        <span>
                          <Link
                            url="https://polaris.shopify.com"
                            target="_blank"
                            removeUnderline
                          >
                            Polaris
                          </Link>
                          {", "}
                          <Link
                            url="https://shopify.dev/docs/apps/tools/app-bridge"
                            target="_blank"
                            removeUnderline
                          >
                            App Bridge
                          </Link>
                        </span>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">
                          API
                        </Text>
                        <Link
                          url="https://shopify.dev/docs/api/admin-graphql"
                          target="_blank"
                          removeUnderline
                        >
                          GraphQL API
                        </Link>
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
                </Card>
                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      Useful Links
                    </Text>
                    <List>
                      <List.Item>
                        <Link
                          url="https://youtube.com/codeinspire"
                          target="_blank"
                          removeUnderline
                        >
                          YouTube: Code Inspire
                        </Link>
                      </List.Item>
                      <List.Item>
                        <Link
                          url="https://www.prisma.io/docs/getting-started/quickstart"
                          target="_blank"
                          removeUnderline
                        >
                          Prisma Documentation
                        </Link>
                      </List.Item>
                      <List.Item>
                        <Link
                          url="https://remix.run/docs/en/main"
                          target="_blank"
                          removeUnderline
                        >
                          Remix Documentation
                        </Link>
                      </List.Item>
                      <List.Item>
                        <Link
                          url="https://www.youtube.com/watch?v=HOysnl2Yo4s"
                          target="_blank"
                          removeUnderline
                        >
                          YouTube: How to Host Your Shopify App
                        </Link>
                      </List.Item>
                      <List.Item>
                        <Link
                          url="https://shopify.dev/docs/apps/launch/deployment/deploy-web-app"
                          target="_blank"
                          removeUnderline
                        >
                          Shopify Docs: Deploy a Web App
                        </Link>
                      </List.Item>
                      <List.Item>
                        <Link
                          url="https://fly.io/docs"
                          target="_blank"
                          removeUnderline
                        >
                          Fly.io Documentation
                        </Link>
                      </List.Item>
                    </List>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>
    );
  }
  