const path = require("path");
const { createFilePath } = require("gatsby-source-filesystem");

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

  const docArticle = path.resolve("./src/components/Document/DocTemplate.jsx");
  const result = await graphql(
    `
      {
        allMarkdownRemark(
          sort: { fields: [frontmatter___date], order: DESC }
          limit: 1000
        ) {
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                title
              }
            }
          }
        }
      }
    `
  );

  if (result.errors) {
    throw result.errors;
  }

  // Create blog articles pages.
  const articles = result.data.allMarkdownRemark.edges;

  articles.forEach((article, index) => {
    const previous = index === articles.length - 1 ? null : articles[index + 1].node;
    const next = index === 0 ? null : articles[index - 1].node;

    createPage({
      path: article.node.fields.slug,
      component: docArticle,
      context: {
        slug: article.node.fields.slug,
        previous,
        next,
      },
    });
  });
};

// Implement the Gatsby API “onCreatePage”. This is
// called after every page is created.
exports.onCreatePage = async ({ page, actions }) => {
  const { createPage } = actions;
  // Only update the `/app` page.
  if (page.path.match(/^\/fairybiome/)) {
    // page.matchPath is a special key that's used for matching pages
    // with corresponding routes only on the client.
    page.matchPath = "/fairybiome/*";
    // Update the page.
    createPage(page);
  }
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === "MarkdownRemark") {
    const value = createFilePath({ node, getNode });
    createNodeField({
      name: "slug",
      node,
      value,
    });
  }
};

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    node: {
      fs: "empty"
    }
  });
};
