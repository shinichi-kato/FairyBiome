import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";
import Box from "@material-ui/core/Box";

const useStyles = makeStyles((theme) => ({
  iconContainer: {
    width: 120,
    height: 120,
    margin: "auto",
  },
  icon: {
    width: 120,
    height: 120,
    margin: "auto",
  },
  nameContainer: {
    margin: "auto",
  },
  name: {
    padding: theme.spacing(2),
    fontSize: 22,
  }

}));

export default function ChatAvatar(props) {
  const classes = useStyles();

  return (
    <Box
      alignItems="center"
      display="flex"
      flexDirection="column"
    >
      <Box className={classes.iconContainer}>
        <Avatar
          className={classes.icon}
          src={`../../svg/${props.icon}`}
        />
      </Box>
      <Box className={classes.nameContainer}>
        <Typography className={classes.name}>
          { props.displayName }
        </Typography>
      </Box>
    </Box>
  );
}
