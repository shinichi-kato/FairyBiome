import React from "react";
import { navigate } from "gatsby";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import IconButton from "@material-ui/core/IconButton";

import HabitatIcon from "../../icons/Habitat";

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
    padding: theme.spacing(0),
    fontSize: 18,
  }

}));

export default function MeetFairy(props) {
  const classes = useStyles();

  return (
    <Box
      alignItems="center"
      display="flex"
      flexDirection="column"
    >
      <Box className={classes.iconContainer}>
        <IconButton>
          <HabitatIcon
            className={classes.icon}
            onClick={()=>navigate("/fairybiome/Habitat/")}
          />
        </IconButton>
      </Box>
      <Box className={classes.nameContainer}>
        <Typography className={classes.name}>
          {props.habitatTitle}<HabitatIcon />で
        </Typography>
        <Typography className={classes.name}>
          妖精を見つけよう！
        </Typography>
      </Box>
    </Box>
  );
}
