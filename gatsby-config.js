require("dotenv").require()
module.exports = {
  // Customize me!
  siteMetadata: {
    company: "人工無脳は考える",
    domain: "",
    site:"",
    title:
      "FairyBiome",
    // preamble:
    //   "",
    // defaultDescription: "",
    // postamble: "",
    // contact: {
    //   email: "",
    // },
    // menuLinks: [],
  },
  pathPrefix: "/",
  plugins: [
    {
      resolve: "gatsby-plugin-firebase",
      options: {
        features: {
          auth: true,
          database: false,
          firestore: true,
          storage: false,
          messaging: false,
          functions: true,
        }
      }
    },
    "gatsby-plugin-top-layout",
    "gatsby-plugin-react-helmet",
    "gatsby-plugin-remove-serviceworker",
    {
      resolve: "gatsby-plugin-material-ui",
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: "FairyBiome",
        short_name: "FairyBiome",
        start_url: "/",
        background_color: "#eeeeee",
        //theme_color: "#6b37bf",
        // Enables "Add to Homescreen" prompt and disables browser UI (including back button)
        // see https://developers.google.com/web/fundamentals/web-app-manifest/#display
        display: "standalone",
        icon: "images/logo.png", // This path is relative to the root of the site.
        // An optional attribute which provides support for CORS check.
        // If you do not provide a crossOrigin option, it will skip CORS for manifest.
        // Any invalid keyword or empty string defaults to `anonymous`
        //crossOrigin: `use-credentials`,
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        path: `${__dirname}/src/pages`,
        name: "pages",
        ignore: [`**/\.*`],
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        path: `${__dirname}/docs`,
        name: "docs",
        ignore: [`**/\.*`],
      },
    },

    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
            },
          },
          // {
          //   resolve: `gatsby-remark-responsive-iframe`,
          //   options: {
          //     wrapperStyle: `margin-bottom: 1.0725rem`,
          //   },
          // },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    // {
    //   resolve: `gatsby-plugin-google-analytics`,
    //   options: {
    //     //trackingId: `ADD YOUR TRACKING ID HERE`,
    //   },
    // },

    {
      resolve: `gatsby-plugin-favicon`,
      options: {
        logo: "./images/logo.png",
      },
    },
    
  ],
};
