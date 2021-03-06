import { createMuiTheme } from "@material-ui/core/styles";

// autism-friendly pallette
// 発達障害児や自閉症児が見やすいトーンを抑えた配色

const theme = createMuiTheme({
  overrides: {
    MuiCssBaseline: {
      "@global": {
        html: {
          width: "100%",
          height: "100%",
          margin: 0,
          padding: 0,
          webkitFontSmoothing: "antialiased",
          mozOsxFontSmoothing: "grayscale",
          overscrollBehaviorY: "none",
          backgroundColor: "#eeeeee",
        },
        body: {
          position: "fixed",
          width: "100%",
          height: "100%",
          ["@media (min-width: 481px)"]: {
            width: 480,
            marginLeft: "calc((100% - 480px)  * 0.3)",
            marginRight: "calc((100% - 480px) * 0.7)",
          },
        }
      }
    }
  },
  palette: {
    primary: { main: "#212962" },
    secondary: { main: "#BF360C" },
    background: { default: "#D7D6D6"},
    error: { main: "#a52228", },
  },
});

export default theme;
